import {
  EventDispatcher
} from 'three';

import {
  lsTest
} from '../utils/localStorage';

export class Score extends EventDispatcher {
  constructor () {
    super();

    this.score = 0;
    this.highScore = 0;
    this.baseScore = 10;
    this.delta = 0;
    this.comboMultiplier = 1;
    this.comboTimeLeft = 1;
    this.percentage = 50;
    this.updating = false;

    if (lsTest() && localStorage.getItem('fireworks_highscore')) {
      this.highScore = localStorage.getItem('fireworks_highscore');
    }
  }

  increaseDelta (dt) {
    this.delta += dt;
  }

  resetDelta () {
    this.delta = 0;
  }

  comboCounterUpdate (dt) {
    if (this.comboTimeLeft > 2) {
      if (this.comboMultiplier === 5) {
        this.comboTimeLeft = 2;

        return true;
      }

      this.comboMultiplier += 1;
      this.comboTimeLeft = 1;
      this.percentage = this.comboTimeLeft * 100 / 2;

      this.dispatchEvent({
        type: 'changeMultiplier'
      });
    }

    if (this.comboMultiplier > 1 && this.comboTimeLeft < 0) {
      this.comboMultiplier -= 1;
      this.comboTimeLeft = 2;
      this.percentage = this.comboTimeLeft * 100 / 2;

      this.dispatchEvent({
        type: 'changeMultiplier'
      });
    }

    if (this.comboMultiplier === 1 && this.comboTimeLeft < 0) {
      this.dispatchEvent({
        type: 'gameOver'
      });
    }

    if (this.updating) {
      return true;
    }

    this.comboTimeLeft -= dt / 30;

    this.dispatchEvent({
      type: 'timeDecrease'
    });
  }

  hit () {
    this.score += Math.floor((this.delta + this.baseScore) * this.comboMultiplier * 10);
    this.highScore = this.score > this.highScore ? this.score : this.highScore;
    this.resetDelta();
    this.comboTimeLeft += 0.25;
    this.percentage = this.comboTimeLeft * 100 / 2;

    this.dispatchEvent({
      type: 'change'
    });
  }

  restart () {
    this.reset();

    this.score = 0;

    this.dispatchEvent({
      type: 'change'
    });
  }

  breakCombo () {
    this.comboTimeLeft -= 0.1;

    this.dispatchEvent({
      type: 'comboBreak'
    });
  }

  reset () {
    this.comboMultiplier = 1;
    this.comboTimeLeft = 1;
    this.percentage = this.comboTimeLeft * 100 / 2;

    this.dispatchEvent({
      type: 'changeMultiplier'
    });
  }
}
