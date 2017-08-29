import {
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Texture
} from 'three';

import {
  FontColors
} from '../fontColors';

import {
  Fonts
} from '../fonts';

import {
  translate
} from '../../utils/translate';

export default class BestScore extends Mesh {
  static CANVAS_WIDTH = 1024;
  static CANVAS_HEIGHT = 256;

  constructor (score) {
    const canvas = document.createElement('canvas');

    canvas.width = BestScore.CANVAS_WIDTH;
    canvas.height = BestScore.CANVAS_HEIGHT;

    const context = canvas.getContext('2d');

    context.fillStyle = FontColors.cyan;
    context.font = `70px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(
      (`${translate.get('start-best')} ${score}`).toUpperCase(),
      BestScore.CANVAS_WIDTH / 2,
      BestScore.CANVAS_HEIGHT / 2
    );

    const geometry = new PlaneGeometry(
      BestScore.CANVAS_WIDTH / 100,
      BestScore.CANVAS_HEIGHT / 100
    );

    const texture = new Texture(canvas);

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    super(geometry, material);

    this.scale.set(1, 1, 1);
    this.position.y = -5;
    this.material.map.needsUpdate = true;
  }

  dispose () {
    this.material.dispose();
    this.geometry.dispose();
  }
}
