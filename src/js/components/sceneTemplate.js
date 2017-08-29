import {
  PerspectiveCamera,
  Scene
} from 'three';

export class SceneTemplate {
  constructor (renderer) {
    this.animate = this.animate.bind(this);

    this.renderer = renderer;
    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4500);
    this.scene = new Scene();
  }

  animate () {
    this.render();
  }

  render () {
    this.renderer.render(this.scene, this.camera);
  }
}
