import {
  Quart,
  TweenMax
} from 'gsap';

import {
  BoxGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Object3D,
  Mesh,
  MeshBasicMaterial,
  TubeBufferGeometry,
  Vector2,
  Vector3
} from 'three';

import {
  Agent
} from '../../utils/steering';

import {
  MeshSpriteSheet
} from '../../utils/spritesheet';

import {
  preloader
} from '../../utils/preloader';

import {
  easeOutQuad
} from '../../utils/math';

import {
  computeFrenetFrames
} from '../../utils/curve';

import {
  addLeadingZero
} from '../../utils/string';

export default class RocketTrail {
  constructor (colorName, vIni) {
    this.colorName = colorName;
    this.vIni = new Vector3(vIni.x, vIni.y, vIni.z);
    this.vEnd = new Vector3(this.vIni.x, this.vIni.y - 0.1, this.vIni.z);

    this.radius = 0;

    this.initPoints();
    this.initCurve();
    this.initTexture();
    this.initMesh();
    this.initSpriteSheet();

    this.animate = preloader.extras;

    if (!this.animate) {
      this.updateAnimatedObjects(100);
    }
  }

  initPoints () {
    this.points = [];

    for (let i = 0; i < 16; i++) {
      const point = new Agent(new Vector3(1, i * 1, 0));

      this.points.push(point);
    }
  }

  initCurve () {
    const pointsPos = [];

    this.points.forEach((point) => {
      pointsPos.push(point.pos);
    });

    this.curve = new CatmullRomCurve3(pointsPos);
  }

  initTexture () {
    this.textureData = preloader.getResult(`rocket-trail-${this.colorName}-data`);
    this.texture = preloader.textures[`rocket-trail-${this.colorName}`];
  }

  initMesh () {
    this.radialSegments = 1;
    this.tubularSegments = 16;

    if (preloader.extras) {
      this.tubularSegments = 32;
    }

    this.vertex = new Vector3();
    this.normal = new Vector3();

    const geometry = new TubeBufferGeometry(this.curve, this.tubularSegments, this.radius, this.radialSegments, false);

    const material = new MeshBasicMaterial({
      map: this.texture,
      side: DoubleSide,
      transparent: true,
      depthTest: false
    });

    const mesh = new Mesh(geometry, material);

    this.mesh = mesh;

    this.object3D = mesh;
  }

  initDebug () {
    this.debugPoints = [];

    this.object3D = new Object3D();
    this.object3D.add(this.mesh);

    for (let i = 0; i < this.points.length; i++) {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xFF0000 });
      const mesh = new Mesh(geometry, material);

      this.object3D.add(mesh);
      this.debugPoints.push(mesh);
    }
  }

  generateSegments (i) {
    const P = this.curve.getPointAt(i / this.tubularSegments);

    const N = this.frames.normals[i];
    const B = this.frames.binormals[i];

    const v = 0;

    const sin = Math.sin(v);
    const cos = -Math.cos(v);

    const taper = 0.5;
    const radius = this.radius * easeOutQuad(this.tubularSegments - i, taper, 1 - taper, this.tubularSegments);

    this.normal.x = (cos * N.x + sin * B.x);
    this.normal.y = (cos * N.y + sin * B.y);
    this.normal.z = (cos * N.z + sin * B.z);
    this.normal.normalize();

    this.vertex.x = P.x + radius * this.normal.x;
    this.vertex.y = P.y + radius * this.normal.y;
    this.vertex.z = P.z + radius * this.normal.z;

    this.vertices.push(this.vertex.x, this.vertex.y, this.vertex.z);

    this.vertex.x = P.x - radius * this.normal.x;
    this.vertex.y = P.y - radius * this.normal.y;
    this.vertex.z = P.z - radius * this.normal.z;

    this.vertices.push(this.vertex.x, this.vertex.y, this.vertex.z);
  }

  initSpriteSheet () {
    const name = 'rocketTail_';

    this.spriteSheet = new MeshSpriteSheet(this.object3D, name);

    let hasFrame = true;
    let i = 0;
    let frameId = '';
    let frameData = {};

    while (hasFrame) {
      frameId = `${name}${addLeadingZero(i, 3)}`;
      frameData = this.getGeometryDataFromMap(frameId);

      if (frameData) {
        this.spriteSheet.addFrameData(frameData);
      } else {
        hasFrame = false;
      }

      i++;
    }
  }

  getGeometryDataFromMap (id) {
    const map = this.textureData;
    const obj = map.frames[id];

    if (!obj) {
      return null;
    }

    const data = {
      pivot: {
        x: 0.5,
        y: 0.5
      },
      frameUV: {
        x: 0,
        y: 0,
        w: 1,
        h: 1
      },
      frame: null
    };

    const mw = map.meta.size.w;
    const mh = map.meta.size.h;

    data.pivot.x = obj.pivot.x - 0.5;
    data.pivot.y = obj.pivot.y - 0.5;

    data.frameUV.x = obj.frame.x / mw;
    data.frameUV.y = 1 - obj.frame.y / mh;
    data.frameUV.w = obj.frame.w / mw;
    data.frameUV.h = -obj.frame.h / mh;

    data.frame = obj.frame;

    return data;
  }

  update (dt) {
    if (this.hideComplete) {
      return;
    }

    if (!this.showed) {
      return;
    }

    this.updatePoints();
    this.updateCurve();
    this.updateDebug();

    if (this.animate) {
      this.updateAnimatedObjects(dt);
    }
  }

  updatePoints () {
    this.points.forEach((point, index) => {
      if (index) {
        point.target.copy(this.points[index - 1].pos);
      }

      if (index) {
        point.acc.add(point.arrive(point.target));
      }

      point.update();

      this.curve.points[index].copy(point.pos);
    });
  }

  updateCurve () {
    this.frames = computeFrenetFrames(this.curve, this.tubularSegments);
    this.vertices = [];
    this.normals = [];

    for (let i = 0; i <= this.tubularSegments; i++) {
      this.generateSegments(i);
    }

    this.mesh.geometry.attributes.position.set(this.vertices);
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  updateDebug () {
    if (!this.debugPoints) {
      return;
    }

    this.points.forEach((point, index) => {
      this.debugPoints[index].position.copy(point.pos);
    });
  }

  updateAnimatedObjects (dt) {
    const mesh = this.mesh;

    if (!this.spriteSheet) {
      return;
    }

    const needsUpdate = this.spriteSheet.update(dt);

    if (!needsUpdate) {
      return;
    }

    const frame = this.spriteSheet.getCurrFrameData();
    const frameUV = frame.frameUV;
    const uv = new Vector2();
    const uvs = [];

    for (let i = 0; i <= this.tubularSegments; i++) {
      for (let j = 0; j <= this.radialSegments; j++) {
        uv.x = (i / this.tubularSegments) * frameUV.w + frameUV.x;
        uv.y = (j / this.radialSegments) * frameUV.h + frameUV.y;

        uvs.push(uv.x, uv.y);
      }
    }

    mesh.geometry.attributes.uv.array = new Float32Array(uvs);
    mesh.geometry.attributes.uv.needsUpdate = true;
  }

  show () {
    if (this.showed) {
      return;
    }

    this.showed = true;

    TweenMax.to(this, 0.5, {
      radius: 1
    });
  }

  hide (immediate) {
    if (this.hideStart) {
      return;
    }

    this.hideStart = true;

    if (immediate) {
      this.reset(this.colorName, this.vIni);

      return;
    }

    TweenMax.to(this, 0.5, {
      radius: 0,
      ease: Quart.easeOut,
      onComplete: () => {
        this.update(0);
        this.hideComplete = true;
        this.showed = false;
      }
    });
  }

  dispose () {
    this.object3D.geometry.dispose();
    this.object3D.material.dispose();
    this.object3D = null;

    this.points = null;
    this.curve = null;
    this.texture = null;
  }

  reset (colorName, vIni) {
    this.vIni = new Vector3(vIni.x, vIni.y, vIni.z);
    this.vEnd = new Vector3(this.vIni.x, this.vIni.y - 0.1, this.vIni.z);

    this.radius = 0;
    this.hideStart = false;
    this.hideComplete = false;

    this.update(0);

    this.showed = false;

    const dist = this.vIni.distanceTo(this.vEnd);
    const slice = dist / this.points.length;

    this.points.forEach((point, index) => {
      const pos = this.vEnd.clone().sub(this.vIni).normalize().multiplyScalar(slice * index).add(this.vIni);
      const prev = (index) ? this.points[index - 1] : null;

      point.pos.set(pos.x, pos.y, pos.z);

      if (prev) {
        point.target = prev.pos;
      }
    });

    if (colorName === this.colorName) {
      return;
    }

    this.colorName = colorName;

    this.initTexture();
    this.initSpriteSheet();

    this.object3D.material.map = this.texture;

    if (!this.animate) {
      this.updateAnimatedObjects(100);
    }
  }

  vrModeChange (isPresenting) {
    if (isPresenting) {
      this.animate = false;

      this.updateAnimatedObjects(100);
    } else {
      this.animate = preloader.extras;
    }
  }
}
