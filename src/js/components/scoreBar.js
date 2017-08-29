import {
  Object3D,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Texture
} from 'three';

import {
  Power3,
  TweenMax
} from 'gsap';

import {
  Bars
} from './barsMesh';

import {
  Colors
} from './comboBarColors';

import {
  Fonts
} from './fonts';

import {
  audioController
} from '../utils/audioController';

export default class ScoreBar extends Object3D {
  constructor (score) {
    super();

    this.score = score;

    this.mainColor = { r: 0, g: 255, b: 210 };

    this.lastMultiplier = 1;
    this.lastScore = 1;
    this.isInitialRender = true;

    this.container = new Object3D();
    this.container.position.y = -15;
    this.container.rotation.x = -30 * Math.PI / 180;
    this.container.scale.set(0.01, 0.01, 0.01);
    this.add(this.container);

    this.multiplierCanvas = document.createElement('canvas');
    this.multiplierCanvas.width = 512;
    this.multiplierCanvas.height = 256;
    this.multiplierContext = this.multiplierCanvas.getContext('2d');

    this.scoreCanvas = document.createElement('canvas');
    this.scoreCanvas.width = 1024;
    this.scoreCanvas.height = 256;
    this.scoreContext = this.scoreCanvas.getContext('2d');

    const multiplierGeometry = new PlaneGeometry(4, 2);
    const multiplierTexture = new Texture(this.multiplierCanvas);
    const multiplierMaterial = new MeshBasicMaterial({
      map: multiplierTexture,
      transparent: true,
      depthTest: false
    });

    this.multiplierMesh = new Mesh(multiplierGeometry, multiplierMaterial);
    this.multiplierMesh.position.x = -5;
    this.multiplierMesh.position.y = -0.25;
    this.multiplierMesh.position.z = 0.01;
    this.multiplierMesh.renderOrder = 1;
    this.container.add(this.multiplierMesh);

    const scoreGeometry = new PlaneGeometry(8, 2);
    const scoreTexture = new Texture(this.scoreCanvas);
    const scoreMaterial = new MeshBasicMaterial({
      map: scoreTexture,
      transparent: true,
      depthTest: false
    });

    this.scoreMesh = new Mesh(scoreGeometry, scoreMaterial);
    this.scoreMesh.position.x = 8.5;
    this.scoreMesh.position.y = -0.25;
    this.scoreMesh.position.z = -0.01;
    this.container.add(this.scoreMesh);

    this.onScoreChange = this.onScoreChange.bind(this);
    this.onMultiplierChange = this.onMultiplierChange.bind(this);
    this.onTimeDecrease = this.onTimeDecrease.bind(this);
    this.onScoreTweeningComplete = this.onScoreTweeningComplete.bind(this);
    this.onRocketMissed = this.onRocketMissed.bind(this);

    this.score.addEventListener('change', this.onScoreChange);
    this.score.addEventListener('changeMultiplier', this.onMultiplierChange);
    this.score.addEventListener('timeDecrease', this.onTimeDecrease);
    this.score.addEventListener('comboBreak', this.onRocketMissed);

    this.bars = new Bars();

    this.container.add(this.bars.container);
    this.container.add(this.bars.lines);
    this.bars.addEventListener('scoreTweeningComplete', this.onScoreTweeningComplete);

    this.position.y = -1.5;
    this.scale.set(0.7, 0.7, 0.7);

    this.onScoreChange();
    this.onMultiplierChange();
  }

  dispose () {
    this.remove(this.mesh);
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.mesh = null;

    this.multiplierCanvas = null;
    this.multiplierContext = null;
  }

  animateIn () {
    TweenMax.to(this.container.scale, 1, {
      x: 1,
      y: 1,
      z: 1,
      ease: Power3.easeOut
    });

    TweenMax.to(this.container.position, 1, {
      y: 0,
      ease: Power3.easeOut,
      onComplete: () => {
        this.isVisible = true;
      }
    });
  }

  animateOut () {
    TweenMax.to(this.container.scale, 1, {
      x: 0.01,
      y: 0.01,
      z: 0.01,
      ease: Power3.easeOut
    });

    TweenMax.to(this.container.position, 1, {
      y: -15,
      ease: Power3.easeOut,
      onComplete: () => {
        this.isVisible = false;
      }
    });
  }

  blinkMultiplier () {
    TweenMax.killTweensOf(this.multiplierMesh.material);

    TweenMax.to(this.multiplierMesh.material, 0.15, {
      opacity: 0,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        TweenMax.to(this.multiplierMesh.material, 0.3, {
          opacity: 1
        });
      }
    });
  }

  blinkScore () {
    TweenMax.killTweensOf(this.scoreMesh.material);

    TweenMax.to(this.scoreMesh.material, 0.15, {
      opacity: 0,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        TweenMax.to(this.scoreMesh.material, 0.3, {
          opacity: 1
        });
      }
    });
  }

  updateMultiplier () {
    const context = this.multiplierContext;
    const combo = Math.round(this.score.comboMultiplier);

    context.clearRect(0, 0, this.multiplierCanvas.width, this.multiplierCanvas.height);
    context.fillStyle = '#000000';
    context.font = `70px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.fillText('x', 0, this.multiplierCanvas.height * 0.5);

    context.fillStyle = '#000000';
    context.font = `140px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.fillText(combo.toString(), 30, this.multiplierCanvas.height * 0.5);

    this.multiplierMesh.material.map.needsUpdate = true;
  }

  updateScore () {
    const context = this.scoreContext;
    const score = Math.round(this.score.score);

    context.clearRect(0, 0, this.scoreCanvas.width, this.scoreCanvas.height);

    context.fillStyle = `rgba(${this.mainColor.r},${this.mainColor.g},${this.mainColor.b},1)`;
    context.font = `70px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.fillText(score.toString(), 0, this.scoreCanvas.height * 0.5);

    const width = context.measureText(score.toString()).width;

    context.font = `30px ${Fonts.brandon.name}`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText('PTS', width + 30, this.scoreCanvas.height * 0.5);

    this.scoreMesh.material.map.needsUpdate = true;
  }

  update () {

  }

  onScoreChange () {
    const newScore = this.score.score;

    if (newScore !== this.lastScore) {
      this.score.updating = true;
      this.updateScore();
      this.bars.moveTo(this.score.percentage / 100, this.score.comboMultiplier);

      if (!this.isInitialRender) {
        this.blinkScore();
      }
    }

    this.lastScore = newScore;
    this.isInitialRender = false;
  }

  onMultiplierChange () {
    if (this.score.comboMultiplier > this.lastMultiplier) {
      audioController.play(`combo_x${this.score.comboMultiplier}`);
    } else {
      audioController.play('combo_decrease');
    }

    this.score.updating = true;

    this.updateMultiplier();

    this.bars.clearLines(this.lastMultiplier);
    this.bars.createLines(this.score.comboMultiplier);
    this.bars.moveTo(this.score.comboTimeLeft / 2, this.score.comboMultiplier);
    this.bars.changeColor(this.score.comboMultiplier);

    this.changeColor(this.score.comboMultiplier);

    this.lastMultiplier = Math.floor(this.score.comboMultiplier);

    this.updateScore();

    if (!this.isInitialRender) {
      this.blinkMultiplier();
    }
  }

  onRocketMissed () {
    this.score.updating = true;

    this.bars.moveTo(this.score.comboTimeLeft / 2, this.score.comboMultiplier);
  }

  onTimeDecrease () {
    this.bars.setLength(this.score.comboTimeLeft / 2, this.score.comboMultiplier);
  }

  onScoreTweeningComplete () {
    this.score.updating = false;
  }

  changeColor (multiplier) {
    this.mainColor.r = Math.floor(Colors[multiplier - 1].r);
    this.mainColor.g = Math.floor(Colors[multiplier - 1].g);
    this.mainColor.b = Math.floor(Colors[multiplier - 1].b);
  }
}
