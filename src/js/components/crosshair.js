import {
  Mesh,
  MeshBasicMaterial,
  RingGeometry
} from 'three';

export class Crosshair extends Mesh {
  static INNER_RADIUS = 0.3;
  static OUTER_RADIUS = 0.5;
  static THETA_SEGMENTS = 10;
  static MATERIAL_COLOR = 0xffffff;

  constructor () {
    const geometry = new RingGeometry(
      Crosshair.INNER_RADIUS,
      Crosshair.OUTER_RADIUS,
      Crosshair.THETA_SEGMENTS
    );

    const material = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.3,
      transparent: true
    });

    super(geometry, material);

    this.position.z = -30;
  }
}
