import {
  Power3,
  TimelineMax,
  TweenMax
} from 'gsap';

import {
  EventDispatcher
} from 'three';

import {
  Colors
} from './comboBarColors';

export class Bars extends EventDispatcher {
  static WIDTH = 1024;
  static HEIGHT = 512;
  static START_ANGLE = 1.40;
  static MARKER_START_ANGLE = 1.41;
  static MAX_ANGLE = 1.55;
  static CIRCLE_X = Bars.WIDTH / 2;
  static CIRCLE_Y = Bars.HEIGHT * 4;
  static CIRCLE_RADIUS = Bars.HEIGHT * 3.5;

  constructor () {
    super();

    this.canvas = document.createElement('canvas');
    this.canvas.width = Bars.WIDTH;
    this.canvas.height = Bars.HEIGHT;
    this.context = this.canvas.getContext('2d');
    this.lines = [];

    const x = Bars.CIRCLE_X + Bars.CIRCLE_RADIUS * Math.cos(Bars.START_ANGLE * Math.PI);
    const y = Bars.CIRCLE_Y + Bars.CIRCLE_RADIUS * Math.sin(Bars.START_ANGLE * Math.PI) - 40;

    this.marker = {
      x,
      y,
      currentX: x,
      currentY: y,
      height: 70,
      width: 15
    };

    this.highscoreMarker = {
      x: Bars.CIRCLE_X + Bars.CIRCLE_RADIUS * Math.cos(Bars.MAX_ANGLE * Math.PI),
      y: Bars.CIRCLE_Y + Bars.CIRCLE_RADIUS * Math.sin(Bars.MAX_ANGLE * Math.PI) - 30
    };

    this.mainColor = {
      r: 0,
      g: 255,
      b: 210
    };
  }

  update () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.lineWidth = 80;
    this.context.strokeStyle = `rgba(${this.mainColor.r}, ${this.mainColor.g}, ${this.mainColor.b},0.2)`;
    this.context.beginPath();
    this.context.arc(Bars.CIRCLE_X, Bars.CIRCLE_Y - 25, Bars.CIRCLE_RADIUS, Bars.START_ANGLE * Math.PI, Bars.MAX_ANGLE * Math.PI);
    this.context.stroke();

    this.lines.forEach((line) => {
      this.drawArch(line);
    });

    this.context.lineWidth = 80;
    this.context.strokeStyle = 'rgba(0,0,0,0.2)';
    this.context.beginPath();
    this.context.arc(Bars.CIRCLE_X, Bars.CIRCLE_Y - 25, Bars.CIRCLE_RADIUS, Bars.MAX_ANGLE * Math.PI, 2 * Math.PI);
    this.context.stroke();

    this.context.beginPath();
    this.context.fillStyle = `rgba(${this.mainColor.r}, ${this.mainColor.g}, ${this.mainColor.b}, 1.0)`;
    this.context.moveTo(this.highscoreMarker.x, this.highscoreMarker.y - this.marker.height / 2);
    this.context.lineTo(this.highscoreMarker.x + this.marker.width, this.highscoreMarker.y - this.marker.height / 2 + 5);
    this.context.lineTo(this.highscoreMarker.x - 5, this.highscoreMarker.y + this.marker.height / 2);
    this.context.fill();

    this.context.beginPath();
    this.context.fillStyle = '#fff';
    this.context.moveTo(this.marker.currentX - this.marker.width / 2, this.marker.currentY - this.marker.height / 2);
    this.context.lineTo(this.marker.currentX + this.marker.width / 2, this.marker.currentY - this.marker.height / 2);
    this.context.lineTo(this.marker.currentX, this.marker.currentY + this.marker.height / 2);
    this.context.fill();
  }

  drawArch (line) {
    this.context.lineWidth = line.lineWidth;
    this.context.strokeStyle = `rgba(${this.mainColor.r},${this.mainColor.g},${this.mainColor.b},0.5)`;
    this.context.beginPath();
    this.context.arc(Bars.CIRCLE_X, Bars.CIRCLE_Y - line.heightFactor, Bars.CIRCLE_RADIUS, Bars.START_ANGLE * Math.PI, line.currentAngle * Math.PI);
    this.context.stroke();
  }

  moveTo (percantage, multiplier) {
    if (this.timeline) {
      this.timeline.kill();
    }

    let value = (Bars.MAX_ANGLE - Bars.START_ANGLE) * percantage / 100;

    value += Bars.START_ANGLE;

    this.timeline = new TimelineMax({
      onComplete: () => {
        this.dispatchEvent({ type: 'scoreTweeningComplete' });
      }
    });

    this.lines.forEach((line) => {
      if (line.multiplier === multiplier) {
        this.timeline.insert(
          TweenMax.to(line, 3 - Math.random() * 3, {
            currentAngle: value - line.angleFactor > Bars.MAX_ANGLE ? Bars.MAX_ANGLE : value - line.angleFactor,
            ease: Power3.easeOut
          })
        );
      }
    });

    value = (Bars.MAX_ANGLE - Bars.MARKER_START_ANGLE) * percantage / 100;
    value += Bars.MARKER_START_ANGLE;

    this.marker.x = Bars.CIRCLE_X + Bars.CIRCLE_RADIUS * Math.cos(value * Math.PI);
    this.marker.y = Bars.CIRCLE_Y + Bars.CIRCLE_RADIUS * Math.sin(value * Math.PI) - 50;

    this.timeline.insert(
      TweenMax.to(this.marker, 2, {
        currentX: this.marker.x,
        currentY: this.marker.y,
        ease: Power3.easeOut
      })
    );
  }

  clearLines (multiplier) {
    const timeline = new TimelineMax({
      onComplete: (multiplier) => {
        this.lines.forEach((line) => {
          if (line.multiplier === multiplier) {
            this.lines.remove(line);
          }
        });
      }
    });

    this.lines.forEach((line) => {
      if (line.multiplier === multiplier) {
        timeline.insert(
          TweenMax.to(line, 2, {
            currentAngle: Bars.MAX_ANGLE,
            opacity: 0,
            ease: Power3.easeOut
          })
        );
      }
    });
  }

  createLines (multiplier) {
    for (let i = 0; i < 10; i++) {
      const line = {
        multiplier,
        currentAngle: Bars.START_ANGLE,
        finishAngle: Bars.MAX_ANGLE - (Bars.MAX_ANGLE - Bars.START_ANGLE) * Math.random() * 0.9,
        heightFactor: 50 * Math.random(),
        gradientFactor: 150 * Math.random(),
        lineWidth: 8 + 24 * Math.random(),
        angleFactor: Math.random() > 0.5 ? Math.random() * 0.05 : Math.random() * -0.05,
        opacity: 1
      };

      this.lines.push(line);
    }
  }

  changeColor (multiplier) {
    TweenMax.to(this.mainColor, 2, {
      r: Colors[multiplier - 1].r,
      g: Colors[multiplier - 1].g,
      b: Colors[multiplier - 1].b,
      ease: Power3.easeOut,
      onUpdate: () => {
        this.mainColor.r = Math.floor(this.mainColor.r);
        this.mainColor.g = Math.floor(this.mainColor.g);
        this.mainColor.b = Math.floor(this.mainColor.b);
      }
    });
  }

  setLength (percantage, multiplier) {
    let value = (Bars.MAX_ANGLE - Bars.START_ANGLE) * percantage / 100;

    value += Bars.START_ANGLE;

    this.lines.forEach((line) => {
      if (line.multiplier === multiplier) {
        line.currentAngle = value - line.angleFactor < Bars.START_ANGLE ? Bars.START_ANGLE : value - line.angleFactor;
        line.currentAngle = line.currentAngle > Bars.MAX_ANGLE ? Bars.MAX_ANGLE : line.currentAngle;
      }
    });

    value = (Bars.MAX_ANGLE - Bars.MARKER_START_ANGLE) * percantage / 100;
    value += Bars.MARKER_START_ANGLE;

    const x = Bars.CIRCLE_X + Bars.CIRCLE_RADIUS * Math.cos(value * Math.PI);
    const y = Bars.CIRCLE_Y + Bars.CIRCLE_RADIUS * Math.sin(value * Math.PI) - 50;

    this.marker.currentX = x;
    this.marker.currentY = y;
  }
}
