import {
  LinearFilter,
  Object3D,
  RGBAFormat,
  SpriteMaterial,
  Sprite,
  Texture
} from 'three';

import {
  preloader
} from '../utils/preloader';

export default class RocketHighlight extends Object3D {
  constructor (color) {
    super();

    const texture = new Texture(preloader.getResult('rocket-selector'));

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBAFormat;
    texture.flipY = true;
    texture.needsUpdate = true;

    const material = new SpriteMaterial({
      color,
      map: texture,
      transparent: true
    });

    this.sprite = new Sprite(material);
    this.sprite.scale.set(5, 5, 1);

    this.add(this.sprite);
  }

  update (dt) {
    this.sprite.material.rotation += dt * 1;
  }
}
