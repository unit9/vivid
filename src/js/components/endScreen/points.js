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

export default class Points extends Mesh {
  static CANVAS_WIDTH = 1024;
  static CANVAS_HEIGHT = 512;

  constructor (score) {
    const canvas = document.createElement('canvas');

    canvas.width = Points.CANVAS_WIDTH;
    canvas.height = Points.CANVAS_HEIGHT;

    const context = canvas.getContext('2d');

    context.fillStyle = FontColors.cyan;
    context.font = `140px ${Fonts.brandonLgt.name}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(
      score,
      Points.CANVAS_WIDTH / 2,
      Points.CANVAS_HEIGHT / 2
    );

    const width = context.measureText(score).width;

    context.font = `20px ${Fonts.brandon.name}`;
    context.fillText(
      'PTS',
      Points.CANVAS_WIDTH / 2 + 50 + width / 2,
      Points.CANVAS_HEIGHT / 2 - 40
    );

    const scoreGeometry = new PlaneGeometry(
      Points.CANVAS_WIDTH / 100,
      Points.CANVAS_HEIGHT / 100
    );

    const scoreTexture = new Texture(canvas);

    const scoreMaterial = new MeshBasicMaterial({
      map: scoreTexture,
      transparent: true,
      depthTest: false
    });

    super(scoreGeometry, scoreMaterial);

    this.scale.set(3.0, 3.0, 1.0);

    this.position.y = 5;
    this.position.z = 0.01;

    this.material.map.needsUpdate = true;
  }

  dispose () {
    this.material.dispose();
    this.geometry.dispose();
  }
}
