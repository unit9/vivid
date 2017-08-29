import { Vector3 } from 'three';

export class Agent {

  constructor(pos) {
    this.acc = new Vector3();
    this.vel = new Vector3();
    this.pos = pos.clone();
    
    this.target = new Vector3();

    this.maxSpeed = 6;
    this.maxSteer = 0.4;
    this.arriveRadius = 40.0;
  }

  update() {
    if (this.acc.lengthSq() > this.maxSteer * this.maxSteer) this.acc.setLength(this.maxSteer);
    this.vel.add(this.acc); 
    if (this.vel.lengthSq() > this.maxSpeed * this.maxSpeed) this.vel.setLength(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0, 0);
  }

  // ---------------------------------------------------------------------------------------------
  // STEERING
  // ---------------------------------------------------------------------------------------------

  seek(target) {
    const steering = new Vector3();
    steering.subVectors(target, this.pos);
    if (steering.lengthSq() > this.maxSteer * this.maxSteer) {
      steering.setLength(this.maxSteer);
    }
    
    return steering;
  }

  flee(target) {
    const steering = new Vector3();
    steering.subVectors(this.pos, target);
    if (steering.lengthSq() > this.maxSteer * this.maxSteer) {
      steering.setLength(this.maxSteer);
    }
    
    return steering;
  }

  arrive(target) {
    const direction = new Vector3().subVectors(target, this.pos);
    const distance = direction.length();
    const targetSpeed = (distance > this.arriveRadius) ? this.maxSpeed : this.maxSpeed * distance / this.arriveRadius;
    const targetVelocity = direction;
    targetVelocity.setLength(targetSpeed);

    const steering = new Vector3();
    steering.subVectors(targetVelocity, this.vel);
    if (steering.lengthSq() > this.maxSteer * this.maxSteer) {
      steering.setLength(this.maxSteer);
    }
    
    return steering;
  }
}
