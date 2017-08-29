import {
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  Texture
} from 'three';

import {
  FontColors
} from '../fontColors';

import {
  Fonts
} from '../fonts';

import {
  preloader
} from '../../utils/preloader';

export default class YourScore extends Mesh {
  static CANVAS_WIDTH = 512;
  static CANVAS_HEIGHT = 256;

  constructor () {
    const canvas = document.createElement('canvas');

    canvas.width = 512;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    context.fillStyle = FontColors.white;
    context.font = `70px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(
      'YOUR SCORE',
      YourScore.CANVAS_WIDTH / 2,
      YourScore.CANVAS_HEIGHT / 2
    );

    const geometry = new PlaneGeometry(
      YourScore.CANVAS_WIDTH / 100,
      YourScore.CANVAS_HEIGHT / 100
    );

    const texture = new Texture(canvas);

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    super(geometry, material);

    this.scale.set(1.5, 1.5, 1.0);

    this.position.y = 10;
    this.position.z = -0.1;

    this.material.map.needsUpdate = true;

    const underlineTexture = new Texture(preloader.getResult('score-underline'));

    underlineTexture.minFilter = LinearFilter;
    underlineTexture.magFilter = LinearFilter;
    underlineTexture.format = RGBAFormat;
    underlineTexture.needsUpdate = true;

    const underlineGeometry = new PlaneGeometry(512, 64);
    const underlineMaterial = new MeshBasicMaterial({
      map: underlineTexture,
      transparent: true
    });

    this.underlineMesh = new Mesh(underlineGeometry, underlineMaterial);

    this.underlineMesh.position.y = -0.7;
    this.underlineMesh.scale.set(0.01, 0.01, 1.0);

    this.add(this.underlineMesh);
  }

  dispose () {
    this.material.dispose();
    this.geometry.dispose();

    this.underlineMesh.material.dispose();
    this.underlineMesh.geometry.dispose();
    this.underlineMesh = null;
  }
}
