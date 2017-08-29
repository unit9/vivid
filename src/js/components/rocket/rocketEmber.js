import { preloader } from '../../utils/preloader';

/* eslint-disable */
import {
  NormalBlending,
  Texture,
  Vector3
} from 'three';

import { Vector2, Vector4, Color, ShaderChunk, Math as Math2, ShaderMaterial, BufferGeometry, Points, BufferAttribute } from 'three';

global._three = {};

_three.ShaderChunk = ShaderChunk;
_three.ShaderMaterial = ShaderMaterial;
_three.Color = Color;
_three.Vector2 = Vector2;
_three.Vector3 = Vector3;
_three.Vector4 = Vector4;
_three.Math = Math2;
_three.Texture = Texture;
_three.BufferGeometry = BufferGeometry;
_three.BufferAttribute = BufferAttribute;
_three.Points = Points;

global.SPE = require('imports?THREE=>_three!shader-particle-engine');
/* eslitn-enable */

export default class RocketSmoke {
  constructor (color) {
    this.color = color;

    this.initParticles();
  }

  initParticles () {
    this.texture = preloader.textures['rocket-ember'];

    this.particleGroup = new SPE.Group({
      blending: NormalBlending,
      maxParticleCount: 20,
      texture: {
        value: this.texture
      },
      transparent: true,
      type: SPE.distributions.SPHERE
    });

    const emitter = new SPE.Emitter({
      maxAge: {
        value: 1
      },
      position: {
        value: new Vector3(0, 0, 0),
        spread: new Vector3(2, 1, 1)
      },
      drag: {
        value: 0.7
      },
      velocity: {
        value: new Vector3(0, 0, 0),
        spread: new Vector3(4, 2, 2)
      },
      angle: {
        value: 0,
        spread: Math.PI
      },
      wiggle: {
        value: 1,
        spread: 0.5
      },
      color: {
        value: new Color(0xFFFFFF),
        spread: new Color(0xFFFFFF)
      },
      size: {
        value: [0.5, 2, 0.5],
        spread: 1
      },
      opacity: {
        value: [1.0, 0.3, 1.0, 0.0]
      },
      alive: false,
      particleCount: 10
    });

    this.particleGroup.addEmitter(emitter);

    this.object3D = this.particleGroup.mesh;

    this.emitter = emitter;

    window.particleGroup = this.particleGroup;
  }

  update (dt) {
    this.particleGroup.tick(dt);
  }

  show () {
    this.emitter.enable();
  }

  hide (immediate) {
    this.emitter.disable();

    if (immediate) {
      this.emitter.reset(true);
    }
  }

  reset (color) {
    if (this.color === color) {
      return;
    }

    this.color = color;

    this.emitter.color.value.forEach((value) => {
      value.set(this.color);
    });

    this.emitter.color.value = this.emitter.color.value;
  }
}
