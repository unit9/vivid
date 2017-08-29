import {
  ConeGeometry,
  Mesh,
  MeshBasicMaterial
} from 'three';

export default class RocketHead {
  constructor (color, height) {
    this.color = color;
    this.height = height;

    this.initMesh();
  }

  initMesh () {
    const radialSegments = 16;

    const geometry = new ConeGeometry(0.6, this.height, radialSegments);
    const material = new MeshBasicMaterial({
      color: this.color
    });

    const mesh = new Mesh(geometry, material);

    this.object3D = mesh;
  }

  dispose () {
    this.object3D.geometry.dispose();
    this.object3D.material.dispose();
    this.object3D = null;
  }
}
