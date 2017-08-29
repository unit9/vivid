import {
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RGBAFormat,
  Texture
} from 'three';

import {
  preloader
} from '../../utils/preloader';

export default class Unit9Presents extends Object3D {
  constructor () {
    super();

    const texture = new Texture(preloader.getResult('u9-logo'));

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBAFormat;
    texture.flipY = true;
    texture.needsUpdate = true;

    const geometry = new PlaneGeometry(256, 128);

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true
    });

    this.mesh = new Mesh(geometry, material);
    this.mesh.scale.set(0.01, 0.01, 1);
    this.mesh.position.z = 0.01;

    this.add(this.mesh);
  }

  dispose () {
    this.remove(this.mesh);

    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh = null;
  }
}
