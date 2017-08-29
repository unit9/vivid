import {
  Quart,
  TweenMax
} from 'gsap';

import EventEmitter from 'events';

import {
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry
} from 'three';

import {
  MeshSpriteSheet
} from '../../utils/spritesheet';

import {
  preloader
} from '../../utils/preloader';

import {
  addLeadingZero
} from '../../utils/string';

export default class RocketSmoke extends EventEmitter {
  constructor (colorName) {
    super();

    this.colorName = colorName;

    this.initTexture();
    this.initMesh();
    this.initSpriteSheet();

    this.updateUV();
  }

  initTexture () {
    this.textureData = preloader.getResult(`rocket-smoke-${this.colorName}-data`);
    this.texture = preloader.textures[`rocket-smoke-${this.colorName}`];
  }

  initMesh () {
    const geometry = new PlaneBufferGeometry(1, 1);

    const material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false
    });

    const mesh = new Mesh(geometry, material);

    mesh.userData.fps = 45;
    mesh.userData.paused = true;
    mesh.scale.set(0.01, 0.01, 1.0);

    this.object3D = mesh;
  }

  initSpriteSheet () {
    const name = 'rocketSmoke_';

    this.spriteSheet = new MeshSpriteSheet(this.object3D, name);

    let hasFrame = true;
    let i = 1;
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

      if (!this.geometryScaled) {
        this.object3D.geometry.scale(frameData.frame.w, frameData.frame.h, 1);

        this.geometryScaled = true;
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

    data.frameUV.x = obj.frame.x / mw;
    data.frameUV.y = 1 - obj.frame.y / mh;
    data.frameUV.w = obj.frame.w / mw;
    data.frameUV.h = -obj.frame.h / mh;

    data.frame = obj.frame;

    return data;
  }

  update (dt) {
    if (!this.spriteSheet) {
      return;
    }

    if (!this.showed) {
      return;
    }

    const needsUpdate = this.spriteSheet.update(dt);

    if (!needsUpdate) {
      return;
    }

    this.updateUV();
  }

  updateUV () {
    const frame = this.spriteSheet.getCurrFrameData();
    const frameUV = frame.frameUV;
    const uvs = [];

    uvs.push(0 * frameUV.w + frameUV.x);
    uvs.push(0 * frameUV.h + frameUV.y);

    uvs.push(1 * frameUV.w + frameUV.x);
    uvs.push(0 * frameUV.h + frameUV.y);

    uvs.push(0 * frameUV.w + frameUV.x);
    uvs.push(1 * frameUV.h + frameUV.y);

    uvs.push(1 * frameUV.w + frameUV.x);
    uvs.push(1 * frameUV.h + frameUV.y);

    this.object3D.geometry.attributes.uv.array = new Float32Array(uvs);
    this.object3D.geometry.attributes.uv.needsUpdate = true;
  }

  show (delay) {
    this.playHandler = this.onPlay.bind(this);

    TweenMax.delayedCall(delay, this.playHandler);

    this.showed = true;
  }

  hide (delay = 0) {
    TweenMax.killDelayedCallsTo(this.playHandler);

    this.spriteSheet.loop = false;

    TweenMax.to(this.object3D.scale, 0.5, {
      x: 0.01,
      y: 0.01,
      delay,
      ease: Quart.easeOut,
      onComplete: () => {
        this.showed = false;
      }
    });
  }

  reset (colorName) {
    this.showed = false;

    if (colorName === this.colorName) {
      return;
    }

    this.colorName = colorName;

    this.initTexture();
    this.initSpriteSheet();

    this.object3D.material.map = this.texture;

    this.updateUV();
  }

  onSpriteSheetLoop () {
    if (this.spriteSheet.loopCount > 1) {
      this.hide();
    }
  }

  onPlay () {
    TweenMax.to(this.object3D.scale, 1, {
      x: 0.1,
      y: 0.1
    });

    this.spriteSheet.loop = false;
    this.spriteSheet.loopCount = 0;
    this.spriteSheet.play();
  }
}
