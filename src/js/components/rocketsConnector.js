import {
  CubeGeometry,
  Object3D,
  Mesh,
  MeshBasicMaterial
} from 'three';

export default class RocketsConnector extends Object3D {
  constructor (rocketA, objectB, size = 0.4) {
    super();

    this.rocketA = rocketA;
    this.objectB = objectB;

    const geometry = new CubeGeometry(size, size, 1);

    const material = new MeshBasicMaterial({
      color: rocketA.color,
      transparent: true,
      opacity: 0.5
    });

    this.container = new Object3D();

    this.add(this.container);

    this.mesh = new Mesh(geometry, material);
    this.mesh.position.z = 0.5;

    this.container.add(this.mesh);
  }

  dispose () {
    if (!this.container) {
      return;
    }

    this.container.remove(this.mesh);

    this.remove(this.container);

    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh = null;

    this.container = null;
  }

  update () {
    if (!this.objectB.parent) {
      this.dispose();

      return;
    }

    if (!this.container) {
      return;
    }

    const objectBWorldPos = this.objectB.parent.localToWorld(this.objectB.position.clone());
    const posB = this.worldToLocal(objectBWorldPos.clone());

    this.container.scale.z = posB.length();
    this.container.lookAt(posB);
  }
}
