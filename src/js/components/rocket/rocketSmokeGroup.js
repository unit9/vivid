import {
  Object3D
} from 'three';

import RocketSmoke from './rocketSmoke';

export default class RocketSmokeGroup {
  constructor (colorName, camera) {
    this.colorName = colorName;
    this.camera = camera;

    this.object3D = new Object3D();

    this.initSmokes();
  }

  initSmokes () {
    this.smokes = [];

    for (let i = 0; i < 4; i++) {
      const smoke = new RocketSmoke(this.colorName);

      this.object3D.add(smoke.object3D);

      this.smokes.push(smoke);
    }
  }

  update (dt, offset, angle) {
    this.smokes.forEach((smoke) => {
      smoke.object3D.position.copy(offset);
      smoke.object3D.rotation.z = angle;
      smoke.update(dt);
    });

    this.object3D.lookAt(this.camera.position);
  }

  show () {
    this.smokes.forEach((smoke, index) => {
      smoke.show(index * 0.3);
    });
  }

  hide () {
    this.smokes.forEach((smoke, index) => {
      smoke.hide(index * 0.1);
    });
  }

  reset (colorName) {
    if (colorName === this.colorName) {
      return;
    } else {
      this.colorName = colorName;
    }

    this.smokes.forEach((smoke) => {
      smoke.reset(this.colorName);
    });
  }
}
