import {
  Object3D,
  Vector2,
  Vector4
} from 'three';

import FireworksTrail from './fireworksTrail';

import {
  preloader
} from '../utils/preloader';

export class Fireworks extends Object3D {
  constructor (colorName, position = null) {
    super();

    this.colorName = colorName;

    if (position) {
      this.position.copy(position);
    }

    this.initTrails();
  }

  initTrails () {
    this.trails = [];
    this.trailCompleteHandler = this.onTrailComplete.bind(this);

    const multiplier = (preloader.extras) ? 1 : 0.7;

    let params = {};

    params = {};
    params.type = 5;
    params.colorName = this.colorName;
    params.amount = Math.floor(20 * multiplier);
    params.scaleRange = new Vector4(0.4, 1.0, 0.5, 1.5);
    params.alphaRange = new Vector2(0.8, 1.0);
    params.timeAlpha = 1.5;
    params.delayAlpha = 0.1;
    params.random2 = 1.0;
    this.makeTrail(params);

    params = {};
    params.type = 5;
    params.colorName = this.colorName;
    params.amount = Math.floor(60 * multiplier);
    params.scaleRange = new Vector4(0.1, 1.0, 0.5, 1.0);
    params.alphaRange = new Vector2(0.1, 0.5);
    params.timeAlpha = 1.5;
    params.delayAlpha = 0.1;
    params.random2 = 1.0;
    this.makeTrail(params);

    params = {};
    params.type = 1;
    params.colorName = this.colorName;
    params.amount = Math.floor(30 * multiplier);
    params.scaleRange = new Vector4(0.5, 1.0, 0.2, 0.4);
    params.timeEdgeY = 1.5;
    this.makeTrail(params);

    params = {};
    params.type = 4;
    params.colorName = this.colorName;
    params.amount = Math.floor(30 * multiplier);
    params.timeEdgeX = 2.5;
    params.timeEdgeY = 2.0;
    params.timeAlpha = 1.5;
    params.delayAlpha = 1.0;
    params.random1 = 1.4;
    params.random2 = 0.4;
    this.makeTrail(params);

    params = {};
    params.type = 4;
    params.colorName = this.colorName;
    params.amount = Math.floor(30 * multiplier);
    params.scaleRange = new Vector4(0.1, 1.0, 0.5, 1.0);
    params.alphaRange = new Vector2(0.1, 0.5);
    params.timeEdgeX = 2.5;
    params.timeEdgeY = 2.0;
    params.timeAlpha = 1.5;
    params.delayAlpha = 1.0;
    params.random1 = 1.4;
    params.random2 = 0.4;
    this.makeTrail(params);
  }

  makeTrail (params) {
    const trail = new FireworksTrail(params);

    trail.on('trail:complete', this.trailCompleteHandler);

    this.add(trail.mesh);

    this.trails.push(trail);
  }

  explode () {
    this.trails.forEach((trail) => {
      trail.explode();
    });
  }

  dispose () {
    this.trails.forEach((trail) => {
      this.remove(trail.mesh);

      trail.dispose();
    });

    while (this.trails.length) {
      this.trails.pop();
    }

    this.trails = null;
  }

  onTrailComplete (e) {
    e.removeListener('trail:complete', this.trailCompleteHandler);

    for (let i = 0; i < this.trails.length; i++) {
      const trail = this.trails[i];

      if (!trail.complete) return;
    }

    this.dispatchEvent({
      type: 'fireworks:complete'
    });
  }
}
