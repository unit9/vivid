import {
  Object3D
} from 'three';

import Unit9Presents from './unit9Presents';
import Logo from './logo';
import EventButton from '../eventButton';
import BestScore from './bestScore';

import {
  Score
} from '../score';

import {
  audioController
} from '../../utils/audioController';

import {
  translate
} from '../../utils/translate';

export class StartScreen extends Object3D {
  static EVENT_BEGIN = 'StartScreen.BEGIN';
  static EVENT_SWITCH_VR = 'StartScreen.SWITCH_VR';

  constructor () {
    super();

    this.isStarted = false;

    this.unit9Presents = new Unit9Presents();
    this.unit9Presents.position.y = 8;
    this.add(this.unit9Presents);

    this.logo = new Logo();
    this.logo.position.y = 1;
    this.logo.position.z = -0.5;
    this.add(this.logo);

    this.startButton = new EventButton('StartButton.TRIGGER', (translate.get('start-cta')).toUpperCase());
    this.startButton.position.x = 0;
    this.startButton.position.y = -8;
    this.add(this.startButton);

    this.onStartButtonTrigger = this.onStartButtonTrigger.bind(this);

    this.startButton.addEventListener('StartButton.TRIGGER', this.onStartButtonTrigger);

    this.score = new Score();

    if (this.score.highScore > 0) {
      this.bestScore = new BestScore(this.score.highScore);
      this.add(this.bestScore);
    }
  }

  dispose () {
    this.remove(this.unit9Presents);
    this.unit9Presents.dispose();
    this.unit9Presents = null;

    this.remove(this.logo);
    this.logo.dispose();
    this.logo = null;

    this.startButton.removeEventListener('StartButton.TRIGGER', this.onStartButtonTrigger);
    this.remove(this.startButton);
    this.startButton.dispose();
    this.startButton = null;

    if (this.bestScore) {
      this.remove(this.bestScore);
      this.bestScore.dispose();
      this.bestScore = null;
    }
  }

  animateIn () {
    audioController.play('game_theme', {
      crossLoop: true,
      forcePlaying: true
    });
  }

  animateOut () {
    return Promise.resolve();
  }

  onStartButtonTrigger () {
    if (this.isStarted) {
      return;
    }

    this.dispatchEvent({
      type: StartScreen.EVENT_BEGIN
    });

    this.isStarted = true;
  }
}
