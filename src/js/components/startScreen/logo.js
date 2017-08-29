import {
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  Texture
} from 'three';

import {
  preloader
} from '../../utils/preloader';

export default class Logo extends Mesh {
  constructor () {
    const texture = new Texture(preloader.getResult('gamelogo'));

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBAFormat;
    texture.flipY = true;
    texture.needsUpdate = true;

    const geometry = new PlaneGeometry(1024, 512);
    const material = new MeshBasicMaterial({ map: texture, transparent: true });

    super(geometry, material);

    this.scale.set(0.03, 0.03, 1.0);
  }

  dispose () {
    this.material.dispose();
    this.geometry.dispose();
  }
}
