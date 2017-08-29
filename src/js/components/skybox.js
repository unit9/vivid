import {
  CubeTexture,
  RGBFormat
} from 'three';

import {
  preloader
} from '../utils/preloader';

export class Skybox {
  constructor () {
    const directions = ['xpos', 'xneg', 'ypos', 'yneg', 'zpos', 'zneg'];
    const images = [];

    directions.forEach((direction) => {
      images.push(preloader.getResult(direction));
    });

    this.cubeTexture = new CubeTexture(images);
    this.cubeTexture.format = RGBFormat;
    this.cubeTexture.needsUpdate = true;
  }
}
