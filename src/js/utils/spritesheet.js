import EventEmitter from 'events';

export class MeshSpriteSheet extends EventEmitter {
  constructor(mesh, name) {
    super();

    this.mesh = mesh;
    this.name = name;

    this.frames = [];

    this.currFrame = 0;
    this.loopCount = 0;
    this.fps = mesh.userData.fps || 25;
    this.delay = mesh.userData.delay;
    this.speed = 1000 / this.fps;
    this.delta = (this.delay) ? this.delay * -1000 : 0;
    this.loop = (mesh.userData.loop !== undefined) ? mesh.userData.loop : true;
    this.paused = (mesh.userData.paused !== undefined) ? mesh.userData.paused : false;
  }

  addFrameData(frameData) {
    this.frames.push(frameData);
    this.numFrames = this.frames.length;
  }

  getCurrFrameData() {
    return this.frames[this.currFrame];
  }

  play() {
    this.currFrame = 0;
    this.paused = false;
  }

  pause() {
    this.paused = true;
  }

  gotoAndPlay(frame) {
    this.currFrame = frame - 1;
    this.delta = this.speed;
    this.paused = false;
  }

  gotoAndStop(frame) {
    this.currFrame = frame;
    this.delta = 0;
    this.paused = true;
  }

  update(dt) {
    // skip if paused
    if (this.paused) return false;

    // update delta
    this.delta += dt;

    // only update if time elapsed is bigger than 1s / fps
    if (this.delta < this.speed) return false;
    this.delta -= this.speed;

    // pause at the end if not looping
    if (this.currFrame >= this.numFrames - 1 && !this.loop) {
      this.pause();
      this.emit('spritesheet:complete', this.loopCount);
      return false;
    }

    let nextFrame = this.currFrame + 1;
    if (this.currFrame >= this.numFrames - 1) {
      nextFrame = 0;
      this.loopCount += 1;
      this.emit('spritesheet:loop', this.loopCount);
    }

    this.currFrame = nextFrame;

    return true;
  }
}
