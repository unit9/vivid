import {
  Color,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry
} from 'three';

export class Explosion extends Mesh {
  constructor (position) {
    const material = new MeshBasicMaterial({
      color: new Color('red'),
      wireframe: true,
      transparent: true
    });

    const geometry = new SphereGeometry(1.0, 10, 10);

    super(geometry, material);

    this.position.copy(position);

    this.isDirty = false;
  }

  update () {
    if (this.scale.x < 5.0) {
      this.scale.addScalar(0.1);

      this.rotation.y += 0.01;

      this.material.opacity -= 0.03;
    } else {
      this.isDirty = true;
    }
  }
}
