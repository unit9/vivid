import {
  Quart,
  Quint,
  TweenMax
} from 'gsap';

import {
  BufferAttribute,
  Euler,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  Mesh,
  RawShaderMaterial,
  RGBAFormat,
  Quaternion,
  Texture,
  Vector2,
  Vector3,
  Vector4
} from 'three';

import EventEmitter from 'events';

import {
  preloader
} from '../utils/preloader';

import {
  PI,
  TWO_PI,
  random
} from '../utils/math';

export default class FireworksTrail extends EventEmitter {
  constructor (params) {
    super();

    this.params = params || {};
    this.params.amount = params.amount || 50;
    this.params.type = params.type || 5;
    this.params.colorName = params.colorName || 'blue';
    this.params.scaleRange = params.scaleRange || new Vector4(0.5, 1.0, 0.2, 1.0);
    this.params.alphaRange = params.alphaRange || new Vector2(0.5, 1.0);
    this.params.timeEdgeX = params.timeEdgeX || 2.25;
    this.params.timeEdgeY = params.timeEdgeY || 2.5;
    this.params.timeAlpha = params.timeAlpha || 1.0;
    this.params.delayAlpha = params.delayAlpha || 0.75;
    this.params.random1 = params.random1 || 0.0;
    this.params.random2 = params.random2 || 0.0;

    this.width = 128;
    this.height = 32;

    this.tween = {
      t: 0,
      edges: [],
      alphas: []
    };

    this.initMesh();
    this.reset();
  }

  initTexture (colorName, type) {
    const texture = new Texture(preloader.getResult(`explosion-${colorName}-${type}`));

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBAFormat;
    texture.flipY = false;
    texture.needsUpdate = true;

    return texture;
  }

  initMesh () {
    const texture = this.initTexture(this.params.colorName, this.params.type);

    const geometry = new InstancedBufferGeometry();

    const positions = new BufferAttribute(new Float32Array([
      0, 1, 0,
      2, 1, 0,
      0, -1, 0,
      2, -1, 0
    ]), 3);

    geometry.addAttribute('position', positions);

    const uvs = new BufferAttribute(new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ]), 2);

    geometry.addAttribute('uv', uvs);

    const indices = new Uint16Array([
      0, 2, 1,
      2, 3, 1
    ]);

    geometry.setIndex(new BufferAttribute(indices, 1));

    const offsets = new InstancedBufferAttribute(new Float32Array(this.params.amount * 3), 3, 1);
    const vector = new Vector3();

    for (let i = 0, ul = offsets.count; i < ul; i++) {
      offsets.setXYZ(i, vector.x, vector.y, vector.z);
    }

    geometry.addAttribute('offset', offsets);

    const scales = new InstancedBufferAttribute(new Float32Array(this.params.amount * 3), 3, 1);

    for (let i = 0, ul = scales.count; i < ul; i++) {
      scales.setXYZ(i, 1.0, 1.0, 1.0);
    }

    geometry.addAttribute('scale', scales);

    const orientations = new InstancedBufferAttribute(new Float32Array(this.params.amount * 4), 4, 1);

    for (let i = 0, ul = orientations.count; i < ul; i++) {
      orientations.setXYZW(i, 0.0, 0.0, 0.0, 1.0);
    }

    geometry.addAttribute('orientation', orientations);

    const edges = new InstancedBufferAttribute(new Float32Array(this.params.amount * 4), 4, 1).setDynamic(true);

    for (let i = 0, ul = edges.count; i < ul; i++) {
      const edge = new Vector4(0.0, 0.1, 0.8, 0.9);

      edges.setXYZW(i, edge.x, edge.y, edge.z, edge.w);
    }

    geometry.addAttribute('edge', edges);

    const alphas = new InstancedBufferAttribute(new Float32Array(this.params.amount * 1), 1, 1).setDynamic(true);

    for (let i = 0, ul = alphas.count; i < ul; i++) {
      alphas.setX(i, 1.0);
    }

    geometry.addAttribute('alpha', alphas);

    const material = new RawShaderMaterial({
      uniforms: {
        map: {
          value: texture
        },
        hueAdjust: {
          value: 0.0
        }
      },
      vertexShader: require('../shaders/fireworks-trail.vert'),
      fragmentShader: require('../shaders/fireworks-trail.frag'),
      transparent: true,
      depthTest: false
    });

    this.mesh = new Mesh(geometry, material);
  }

  skew (small, big) {
    const positions = this.mesh.geometry.attributes.position.array;

    positions[0 * 3 + 1] = small;
    positions[1 * 3 + 1] = big;
    positions[2 * 3 + 1] = -small;
    positions[3 * 3 + 1] = -big;

    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  reset () {
    this.complete = false;

    this.resetScale();
    this.resetOrientation();
  }

  resetScale () {
    const scales = this.mesh.geometry.attributes.scale;

    let rnd = 0;

    for (let i = 0, ul = scales.count; i < ul; i++) {
      rnd = random(this.params.scaleRange.x, this.params.scaleRange.y);

      scales.setXYZ(i, this.width * rnd, this.height * rnd * random(this.params.scaleRange.z, this.params.scaleRange.w), 1.0);
    }

    scales.needsUpdate = true;
  }

  resetOrientation () {
    const orientations = this.mesh.geometry.attributes.orientation;

    const q = new Quaternion();

    for (let i = 0, ul = orientations.count; i < ul; i++) {
      const angle = random(0, TWO_PI);
      const euler = new Euler();

      euler.x = (angle < PI) ? random(0, PI * 0.5) : random(0, -PI * 0.5);
      euler.z = angle;

      q.setFromEuler(euler);

      orientations.setXYZW(i, q.x, q.y, q.z, q.w);
    }

    orientations.needsUpdate = true;
  }

  explode (time = 0.8, rotate = true) {
    this.reset();

    const timeShow = time;
    let rnd1 = 0.0;
    let rnd2 = 0.0;

    const edges = this.mesh.geometry.attributes.edge.array;
    const alphas = this.mesh.geometry.attributes.alpha.array;

    for (let i = 0, i4 = 0; i4 < edges.length; i++, i4 += 4) {
      let e = this.tween.edges[i];
      let a = this.tween.alphas[i];

      TweenMax.killTweensOf(e);
      TweenMax.killTweensOf(a);

      if (this.params.random1) {
        rnd1 = random(this.params.random1);
      }

      if (this.params.random2) {
        rnd2 = random(this.params.random2);
      }

      a = {
        value: random(this.params.alphaRange.x, this.params.alphaRange.y)
      };

      TweenMax.to(a, timeShow * this.params.timeAlpha + rnd1, {
        value: 0.0,
        delay: timeShow * this.params.delayAlpha + rnd2,
        ease: Quart.easeInOut,
        onUpdate: () => {
          alphas[i] = a.value;
        }
      });

      e = new Vector4(0.0010, 0.0011, 0.0010, 0.0011);

      edges[i4 + 0] = e.x;
      edges[i4 + 1] = e.y;
      edges[i4 + 2] = e.z;
      edges[i4 + 3] = e.w;

      TweenMax.to(e, timeShow * this.params.timeEdgeX + rnd1 + rnd2, {
        x: 0.9,
        ease: Quint.easeInOut,
        onUpdate: () => {
          edges[i4 + 0] = e.x;
        }
      });

      TweenMax.to(e, timeShow * this.params.timeEdgeY + rnd1, {
        y: 0.91,
        ease: Quart.easeOut,
        onUpdate: () => {
          edges[i4 + 1] = e.y;
          edges[i4 + 2] = e.y;
          edges[i4 + 3] = e.y * 1.1;

          alphas[i] = a.value;
        }
      });

      this.tween.edges[i] = e;
      this.tween.alphas[i] = a;
    }

    let totalTime = Math.max(this.params.timeAlpha + this.params.delayAlpha, this.params.timeEdgeX);

    totalTime = Math.max(totalTime, this.params.timeEdgeY);
    totalTime += this.params.random1;
    totalTime += this.params.random2;
    totalTime += 0.2;

    TweenMax.killTweensOf(this.tween);

    this.tween.t = 0;

    TweenMax.to(this.tween, time * totalTime, {
      t: 1,
      onUpdate: () => {
        this.mesh.geometry.attributes.edge.needsUpdate = true;
        this.mesh.geometry.attributes.alpha.needsUpdate = true;
      },
      onComplete: () => {
        this.complete = true;

        this.emit('trail:complete', this);
      }
    });

    if (rotate) {
      TweenMax.killTweensOf(this.mesh.rotation);

      this.mesh.rotation.y = random(-0.25);

      TweenMax.to(this.mesh.rotation, totalTime, {
        y: 0.25,
        ease: Quart.easeOut
      });
    } else {
      this.mesh.rotation.y = 0;
    }
  }

  dispose () {
    this.mesh.geometry.dispose();
    this.mesh.material.uniforms.map.value.dispose();
    this.mesh.material.dispose();

    this.tween = null;
    this.params = null;
    this.mesh = null;
  }
}
