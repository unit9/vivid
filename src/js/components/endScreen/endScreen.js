import {
  Power3,
  TweenMax
} from 'gsap';

import {
  Object3D
} from 'three';

import EventButton from '../eventButton';
import YourScore from './yourScore';
import Points from './points';
import HighScore from './highScore';

import {
  audioController
} from '../../utils/audioController';

import {
  translate
} from '../../utils/translate';

import {
  lsTest
} from '../../utils/localStorage';

export class EndScreen extends Object3D {
  static EVENT_RESTART = 'gameRestart';
  static TEXT_SCORE = 'scoreText';
  static TEXT_POINTS = 'points';
  static TEXT_MAXPOINTS = 'maxPoints';
  static LOCALSTORAGE_RECORD = 'fireworks_highscore';

  constructor (score, highScore) {
    super();

    this.isStarted = false;
    this.position.z = -20;
    this.score = score;
    this.highScore = highScore;

    if (lsTest()) {
      if (localStorage.getItem(EndScreen.LOCALSTORAGE_RECORD)) {
        const local = localStorage.getItem(EndScreen.LOCALSTORAGE_RECORD);

        if (local < this.highScore) {
          localStorage.setItem(EndScreen.LOCALSTORAGE_RECORD, this.highScore);
        }
      } else {
        localStorage.setItem(EndScreen.LOCALSTORAGE_RECORD, this.highScore);
      }
    }

    this.createText();

    this.children.forEach((child) => {
      if (child.material) {
        child.material.opacity = 0;
      }

      if (child.children.length > 0 && child.children[0].material) {
        child.children[0].material.opacity = 0;
      }
    });

    this.fadeIn();

    this.restartButton = new EventButton('RestartButton.trigger', (translate.get('end-cta')).toUpperCase());
    this.restartButton.position.y = -4;
    this.restartButton.position.z = 0.03;
    this.add(this.restartButton);

    this.onRestartButtonTrigger = this.onRestartButtonTrigger.bind(this);

    this.restartButton.addEventListener('RestartButton.trigger', this.onRestartButtonTrigger);
  }

  dispose () {
    this.restartButton.removeEventListener('RestartButton.trigger', this.onRestartButtonTrigger);

    const items = [
      EndScreen.TEXT_SCORE,
      EndScreen.TEXT_POINTS,
      EndScreen.TEXT_MAXPOINTS,
      'restartButton'
    ];

    items.forEach((item) => {
      this.remove(this[item]);
      this[item].dispose();
      this[item] = null;
    });

    audioController.stop('twinkle_loop');
  }

  animateIn () {
    audioController.play('game_theme_fade_out', {
      onComplete: () => {
        audioController.play('twinkle_loop', {
          crossLoop: true
        });
      }
    });
  }

  onRestartButtonTrigger () {
    if (this.isStarted) {
      return;
    }

    this.dispatchEvent({ type: EndScreen.EVENT_RESTART });

    this.isStarted = true;
  }

  createText () {
    this[EndScreen.TEXT_SCORE] = new YourScore();
    this.add(this[EndScreen.TEXT_SCORE]);

    this[EndScreen.TEXT_POINTS] = new Points(this.score);
    this.add(this[EndScreen.TEXT_POINTS]);

    this[EndScreen.TEXT_MAXPOINTS] = new HighScore(this.highScore);
    this.add(this[EndScreen.TEXT_MAXPOINTS]);
  }

  fadeIn () {
    this.children.forEach((child) => {
      if (child.material) {
        TweenMax.to(child.material, 2, {
          opacity: 1,
          ease: Power3.easeOut
        });
      }

      if (child.children.length > 0 && child.children[0].material) {
        TweenMax.to(child.children[0].material, 2, {
          opacity: 1,
          ease: Power3.easeOut
        });
      }
    });
  }
}
