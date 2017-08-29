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

export default class HighScore extends Mesh {
  static CANVAS_WIDTH = 1024;
  static CANVAS_HEIGHT = 512;

  constructor (highScore) {
    const canvas = document.createElement('canvas');

    canvas.width = HighScore.CANVAS_WIDTH;
    canvas.height = HighScore.CANVAS_HEIGHT;

    const context = canvas.getContext('2d');

    context.fillStyle = FontColors.cyan;
    context.font = `70px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(
      `BEST SCORE: ${highScore}`,
      HighScore.CANVAS_WIDTH / 2,
      HighScore.CANVAS_HEIGHT / 2
    );

    const bestScoreGeometry = new PlaneGeometry(
      HighScore.CANVAS_WIDTH / 100,
      HighScore.CANVAS_HEIGHT / 100
    );

    const bestScoreTexture = new Texture(canvas);

    const bestScoreMaterial = new MeshBasicMaterial({
      map: bestScoreTexture,
      transparent: true,
      depthTest: false
    });

    super(bestScoreGeometry, bestScoreMaterial);

    this.scale.set(1.5, 1.5, 1.0);

    this.position.y = 1;
    this.position.z = 0.02;

    this.material.map.needsUpdate = true;
  }

  dispose () {
    this.material.dispose();
    this.geometry.dispose();
  }
}
