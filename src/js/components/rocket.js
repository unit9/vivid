/* global require */

import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3
} from 'three';

import RocketHighlight from './rocketHighlight';
import RocketsConnector from './rocketsConnector';
import RocketHead from './rocket/rocketHead';
import RocketTrail from './rocket/rocketTrail';
import RocketSmokeGroup from './rocket/rocketSmokeGroup';
import RocketEmber from './rocket/rocketEmber';
import RocketTakeoff from './rocket/rocketTakeoff';

import {
  audioController
} from '../utils/audioController';

import {
  preloader
} from '../utils/preloader';

import {
  random,
  randomInt
} from '../utils/math';

const CANNON = require('cannon');

export class Rocket extends Object3D {
  static get COLOR_BLUE () { return 'blue'; }
  static get COLOR_PINK () { return 'pink'; }
  static get COLOR_YELLOW () { return 'yellow'; }

  static PARAMETERS = {
    startVelocity: 1.5,
    startFactor: 180,
    velocityXStartFactor: 10,
    velocityZStartFactor: 0,
    velocityYSlowFactor: 0.01,
    velocityYFallFactor: 0.01,
    velocityXFallFactor: 0.05,
    velocityZFallFactor: 0.0001,
    mass: 1000.0,
    maxSpeed: 55,
    minDistance: 40,
    maxDistance: 170
  };

  constructor (colorName, angle, camera) {
    super();

    this.colorName = colorName;
    this.color = getThreeColor(colorName);
    this.camera = camera;
    this.update = this.update.bind(this);
    this.highlightObject = null;
    this.connectorObject = null;
    this.highlightObject = new RocketHighlight(this.color);
    this.batch = -1;

    const boxShape = new CANNON.Box(new CANNON.Vec3(0.9, 1.6, 0.9));

    this.body = new CANNON.Body({
      mass: Rocket.PARAMETERS.mass,
      shape: boxShape,
      collisionFilterGroup: 2,
      collisionFilterMask: 1
    });

    this.headHeight = 2;

    if (preloader.extras) {
      this.takeoff = new RocketTakeoff(this.colorName);
      this.add(this.takeoff.object3D);
    }

    this.trail = new RocketTrail(this.colorName, this.body.position);
    this.add(this.trail.object3D);

    if (preloader.extras) {
      this.smoke = new RocketSmokeGroup(this.colorName, this.camera);
      this.add(this.smoke.object3D);
    }

    this.ember = new RocketEmber(this.color);
    this.add(this.ember.object3D);

    this.head = new RocketHead(this.color, this.headHeight);
    this.add(this.head.object3D);

    const geometry = new BoxGeometry(0.9, 1.6, 0.9);

    geometry.scale(6, 6, 6);

    const material = new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: new Color(this.color)
    });

    this.hitbox = new Mesh(geometry, material);
    this.hitbox.position.y = -2;

    this.add(this.hitbox);

    this.onGazeOver = this.onGazeOver.bind(this);

    this.hitbox.isGazable = true;
    this.hitbox.addEventListener('gazeover', this.onGazeOver);
  }

  update (dt) {
    this.position.copy(this.body.position);

    this.head.object3D.quaternion.copy(this.body.quaternion);

    this.hitbox.quaternion.copy(this.body.quaternion);

    const offset = this.position.clone().multiplyScalar(-1);
    let height = new Vector3(0, this.headHeight * -0.5, 0).applyQuaternion(this.body.quaternion);
    let v = new Vector3();
    let angle = 0;

    if (this.trail) {
      this.trail.object3D.position.copy(offset).add(height);
      this.trail.points[0].pos = this.position.clone();
      this.trail.update(dt * 1000);

      v = new Vector3().subVectors(this.trail.points[0].pos, this.trail.points[5].pos);
      angle = Math.atan2(v.y, v.x) - Math.PI / 2;
    }

    if (this.smoke) {
      height = new Vector3(0, this.headHeight * -2.8, 0).applyAxisAngle(new Vector3(0, 0, 1), angle);

      this.smoke.update(dt * 1000, height, angle);
    }

    if (this.ember) {
      height = new Vector3(0, this.headHeight * -1, 0).applyAxisAngle(new Vector3(0, 0, 1), angle);

      this.ember.object3D.position.copy(offset);
      this.ember.emitter.position.value = this.ember.emitter.position.value.copy(this.position).add(height);
      this.ember.emitter.velocity.value = this.ember.emitter.velocity.value.set(0, -4, 0).applyAxisAngle(new Vector3(0, 0, 1), angle);
      this.ember.update(dt);
    }

    if (this.takeoff) {
      this.takeoff.object3D.position.copy(this.takeoff.iniPosition.clone().add(offset));
      this.takeoff.update(dt * 1000);
    }

    this.initialTimer -= dt;

    if (this.initialTimer > 0) {
      this.hitbox.isGazable = false;

      return true;
    }

    if (this.velocity === null) {
      let velocity = Math.random();

      velocity = Math.random() > 0.5 ? velocity : velocity * -1;

      this.velocity = new CANNON.Vec3(velocity, Rocket.PARAMETERS.startVelocity, Math.random() * -1);
      this.body.velocity = this.velocity;

      if (this.trail) {
        this.trail.show();
      }

      if (this.smoke) {
        this.smoke.show();
      }

      if (this.ember) {
        this.ember.show();
      }

      if (this.takeoff) {
        this.takeoff.show();
      }

      this.hitbox.isGazable = true;

      audioController.play(`rise${randomInt(1, 3)}`);
    }

    if (this.body.velocity.y < Rocket.PARAMETERS.maxSpeed && !this.initialStart) {
      if (this.body.velocity.x > 0) {
        this.body.velocity.x += dt * Rocket.PARAMETERS.velocityXStartFactor;
      } else {
        this.body.velocity.x -= dt * Rocket.PARAMETERS.velocityXStartFactor;
      }

      this.body.velocity.y += dt * Rocket.PARAMETERS.startFactor;
      this.body.velocity.z -= dt * Rocket.PARAMETERS.velocityZStartFactor;
    } else {
      this.initialStart = true;

      if (this.position.y > 0 && this.body.velocity.y < 0) {
        this.body.velocity.x -= this.body.velocity.x * Rocket.PARAMETERS.velocityXFallFactor;
        this.body.velocity.y -= this.body.velocity.y * Rocket.PARAMETERS.velocityYFallFactor;
        this.body.velocity.z -= this.body.velocity.z * Rocket.PARAMETERS.velocityZFallFactor;

        if (this.trail) {
          this.trail.hide();
        }

        if (this.smoke) {
          this.smoke.hide();
        }

        if (this.ember) {
          this.ember.hide();
        }

        if (this.takeoff) {
          this.takeoff.hide();
        }

        if (!this.isBurnt) {
          this.isBurnt = true;

          audioController.play('rocket_fail', {volume: 0.6});
        }
      } else {
        this.body.velocity.y -= this.body.velocity.y * Rocket.PARAMETERS.velocityYSlowFactor;
      }

      this.life -= dt / 15;

      if (this.life < 0) {
        this.isDead = true;
      }

      if (this.highlightObject && this.isHighlighted) {
        this.highlightObject.update(dt);
      }

      if (this.connectorObject) {
        this.connectorObject.update(dt);
      }
    }
  }

  highlight () {
    if (this.isHighlighted) {
      return;
    }

    this.highlightObject.children[0].material.color = this.color;

    this.add(this.highlightObject);

    this.isHighlighted = true;

    this.update(0);
  }

  smother () {
    if (!this.isHighlighted) {
      return;
    }

    this.remove(this.highlightObject);

    this.isHighlighted = false;
  }

  connectTo (objectB) {
    if (!this.connectorObject) {
      this.connectorObject = new RocketsConnector(this, objectB);

      this.add(this.connectorObject);
    } else {
      this.connectorObject.objectB = objectB;
    }
  }

  disconnect () {
    if (this.connectorObject) {
      this.remove(this.connectorObject);

      this.connectorObject.dispose();
      this.connectorObject = null;
    }
  }

  onGazeOver () {
    if (this.hitbox.isGazable) {
      this.dispatchEvent({
        type: 'gazeover'
      });
    }
  }

  vrModeChange (isPresenting) {
    if (isPresenting) {
      if (this.smoke) {
        this.smoke.hide(true);
      }

      if (this.takeoff) {
        this.takeoff.hide(true);
      }

      this._smoke = this.smoke;
      this._takeoff = this.takeoff;

      this.smoke = this.takeoff = null;
    } else {
      if (this._smoke) {
        this.smoke = this._smoke;
      }

      if (this._takeoff) {
        this.takeoff = this._takeoff;
      }
    }

    if (this.trail) {
      this.trail.vrModeChange(isPresenting);
    }
  }

  activate (color, angle, batch) {
    this.body.position = getPositionOnCircle(-22, angle);
    this.isActive = true;
    this.batch = batch;
    this.initialTimer = 1 + 1.3 * Math.random();
    this.initialStart = false;
    this.velocity = null;
    this.life = 0.3;
    this.isBurnt = false;
    this.colorName = color;
    this.color = getThreeColor(color);
    this.hitbox.material.color = this.color;
    this.head.object3D.material.color = this.color;

    if (this.trail) {
      this.trail.reset(this.colorName, this.body.position);
    }

    if (this.smoke) {
      this.smoke.reset(this.colorName);
    }

    if (this.ember) {
      this.ember.reset(this.color);
    }

    if (this.takeoff) {
      this.takeoff.reset(this.colorName, this.body.position);
    }

    audioController.play(`launch${randomInt(1, 3)}`);

    this.disconnect();

    this.smother();
  }

  deactivate () {
    this.disconnect();
    this.smother();

    if (this.trail) {
      this.trail.hide(true);
    }

    if (this.smoke) {
      this.smoke.hide(true);
    }

    if (this.ember) {
      this.ember.hide(true);
    }

    if (this.takeoff) {
      this.takeoff.hide(true);
    }

    this.body.position = new CANNON.Vec3(0, 0, 0);
    this.body.velocity = new CANNON.Vec3(0, 0, 0);
    this.body.quaternion.setFromEuler(0, 0, 0);

    this.position.copy(this.body.position);

    this.isActive = false;
    this.isDead = false;
    this.isHighlighted = false;

    this.batch = -1;
  }
}

function getPositionOnCircle (elevation, baseAngle) {
  const distance = random(Rocket.PARAMETERS.minDistance, Rocket.PARAMETERS.maxDistance);
  const angle = baseAngle - 90;
  const v = new CANNON.Vec3();

  v.x = distance * Math.cos(angle * Math.PI / 180);
  v.y = elevation;
  v.z = distance * Math.sin(angle * Math.PI / 180);

  return v;
}

function getThreeColor (colorName) {
  let hex = 0xFFFFFF;

  if (colorName === Rocket.COLOR_BLUE) {
    hex = 0x4bf2fd;
  }

  if (colorName === Rocket.COLOR_PINK) {
    hex = 0xff2cb9;
  }

  if (colorName === Rocket.COLOR_YELLOW) {
    hex = 0xfff723;
  }

  return new Color(hex);
}
