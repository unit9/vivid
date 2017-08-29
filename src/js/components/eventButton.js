import {
  Power3,
  TweenLite
} from 'gsap';

import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Texture
} from 'three';

import {
  FontColors
} from './fontColors';

import {
  audioController
} from '../utils/audioController';

import {
  random,
  randomInt
} from '../utils/math';

export default class EventButton extends Object3D {
  static CANVAS_SIZE = 256;
  static THEME_COLOR = {
    r: 26,
    g: 255,
    b: 194
  };

  constructor (eventTrigger, text) {
    super();

    this.eventTrigger = eventTrigger;

    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width = EventButton.CANVAS_SIZE;
    this.backgroundCanvas.height = EventButton.CANVAS_SIZE;
    this.backgroundCtx = this.backgroundCanvas.getContext('2d');

    this.arcs = [];

    this.createArcs();

    const arcsGeometry = new PlaneGeometry(5, 5);

    this.arcsTexture = new Texture(this.backgroundCanvas);
    this.arcsTexture.needsUpdate = true;

    const arcsMaterial = new MeshBasicMaterial({
      map: this.arcsTexture,
      transparent: true,
      depthTest: false
    });

    this.arcsMesh = new Mesh(arcsGeometry, arcsMaterial);

    this.add(this.arcsMesh);

    this.progressCanvas = document.createElement('canvas');
    this.progressCanvas.width = EventButton.CANVAS_SIZE;
    this.progressCanvas.height = EventButton.CANVAS_SIZE;
    this.progressCtx = this.progressCanvas.getContext('2d');

    this.progressArc = {
      lineWidth: 8,
      radius: 115,
      opacity: 1,
      startAngle: 0,
      finishAngle: 0
    };

    const progressGeometry = new PlaneGeometry(5, 5);

    this.progressTexture = new Texture(this.progressCanvas);
    this.progressTexture.needsUpdate = true;

    const progressMaterial = new MeshBasicMaterial({
      map: this.progressTexture,
      transparent: true,
      depthTest: false
    });

    this.progressMesh = new Mesh(progressGeometry, progressMaterial);
    this.progressMesh.rotation.z = 90 * Math.PI / 180;

    this.add(this.progressMesh);

    this.vrDisplay = null;

    navigator.getVRDisplays().then((displays) => {
      if (displays.length > 0) {
        this.vrDisplay = displays[0];

        this.animateIn();
      }
    });

    this.onStartGazeOver = this.onStartGazeOver.bind(this);
    this.onStartGazeOut = this.onStartGazeOut.bind(this);

    this.arcsMesh.isGazable = true;
    this.arcsMesh.addEventListener('gazeover', this.onStartGazeOver);
    this.arcsMesh.addEventListener('gazeout', this.onStartGazeOut);

    if (text) {
      this.createText(text);
    }
  }

  updateProgressTick (finalValue) {
    if (this.progressArc.finishAngle === finalValue) {
      return;
    }

    const radius = EventButton.CANVAS_SIZE / 2;

    this.vrDisplay.requestAnimationFrame(this.updateProgressTick.bind(this, finalValue));

    this.progressCtx.clearRect(0, 0, this.progressCanvas.width, this.progressCanvas.height);
    this.progressCtx.lineWidth = this.progressArc.lineWidth;

    this.progressCtx.strokeStyle = `rgba(
      ${EventButton.THEME_COLOR.r},
      ${EventButton.THEME_COLOR.g},
      ${EventButton.THEME_COLOR.b},
      ${this.progressArc.opacity}
    )`;

    this.progressCtx.beginPath();

    this.progressCtx.arc(
      radius,
      radius,
      this.progressArc.radius,
      this.progressArc.startAngle * Math.PI / 180,
      (this.progressArc.startAngle + this.progressArc.finishAngle) * Math.PI / 180
    );

    this.progressCtx.stroke();

    this.progressTexture.needsUpdate = true;
  }

  animateIn () {
    const o = this.arcs[0].opacity;

    this.arcs.forEach((arc) => {
      TweenLite.from(arc, random(2, 4), {
        opacity: 0,
        startAngle: -360 * 5 * Math.PI / 180,
        ease: Power3.easeOut
      });
    });

    this.animateInTick(o);
  }

  animateInTick (finalOpacity) {
    if (this.arcs[0].opacity >= finalOpacity) {
      return;
    }

    this.vrDisplay.requestAnimationFrame(this.animateInTick.bind(this, finalOpacity));

    this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);

    this.arcs.forEach((arc) => {
      this.backgroundCtx.lineWidth = arc.lineWidth;

      const radius = EventButton.CANVAS_SIZE / 2;

      const grad = this.backgroundCtx.createLinearGradient(
        Math.cos(arc.startAngle) * radius + radius,
        Math.sin(arc.startAngle) * radius + radius,
        Math.cos(arc.startAngle + arc.finishAngle) * radius + radius,
        Math.sin(arc.startAngle + arc.finishAngle) * radius + radius
      );

      grad.addColorStop(0, `rgba(
        ${EventButton.THEME_COLOR.r},
        ${EventButton.THEME_COLOR.g},
        ${EventButton.THEME_COLOR.b},
        ${arc.opacity}
      )`);

      grad.addColorStop(1, `rgba(
        ${EventButton.THEME_COLOR.r},
        ${EventButton.THEME_COLOR.g},
        ${EventButton.THEME_COLOR.b},
      0.1)`);

      this.backgroundCtx.strokeStyle = grad;
      this.backgroundCtx.beginPath();
      this.backgroundCtx.arc(radius, radius, arc.radius, arc.startAngle, arc.startAngle + arc.finishAngle);
      this.backgroundCtx.stroke();
    });

    this.arcsTexture.needsUpdate = true;
  }

  createArcs () {
    for (let i = 0; i < 5; i++) {
      const arc = {
        radius: randomInt(110, 120),
        startAngle: i * randomInt(120, 150) * Math.PI / 180,
        finishAngle: randomInt(120, 150) * Math.PI / 180,
        lineWidth: randomInt(10, 16),
        opacity: random(0.5, 0.7)
      };

      this.arcs.push(arc);
    }
  }

  dispose () {
    this.interactive = false;

    this.arcsMesh.removeEventListener('gazeover', this.onStartGazeOver);
    this.arcsMesh.removeEventListener('gazeout', this.onStartGazeOut);

    this.remove(this.arcsMesh);

    this.arcsMesh.geometry.dispose();
    this.arcsMesh.material.dispose();
    this.arcsMesh = null;

    if (this.text) {
      this.remove(this.text);

      this.text.geometry.dispose();
      this.text.material.dispose();
      this.text = null;
    }
  }

  trigger () {
    this.dispatchEvent({
      type: this.eventTrigger
    });

    audioController.play('select2');
  }

  animateOver () {
    TweenLite.killTweensOf(this.arcsMesh.rotation);

    TweenLite.to(this.arcsMesh.rotation, 1, {
      z: -Math.PI * 2,
      ease: Power3.easeOut
    });

    TweenLite.killTweensOf(this.progressArc);

    TweenLite.to(this.progressArc, 3, {
      finishAngle: 360,
      ease: Power3.easeOut,
      onComplete: () => {
        this.trigger();
      }
    });

    this.updateProgressTick(360);
  }

  animateOut () {
    TweenLite.killTweensOf(this.arcsMesh.rotation);

    TweenLite.to(this.arcsMesh.rotation, 1, {
      z: 0,
      ease: Power3.easeOut
    });

    TweenLite.killTweensOf(this.progressArc);

    TweenLite.to(this.progressArc, 3, {
      finishAngle: 0,
      ease: Power3.easeOut
    });

    this.updateProgressTick(0);
  }

  onStartGazeOver (e) {
    if (e.data.intersection.distance !== 0) {
      this.animateOver();

      audioController.play('select1');
    }
  }

  onStartGazeOut () {
    this.animateOut();

    audioController.stop('select1');
  }

  createText (text) {
    const canvas = document.createElement('canvas');

    canvas.width = 512;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    context.fillStyle = FontColors.cyan;
    context.font = '45px Brandon_blk';
    context.textBaseline = 'middle';
    context.textAlign = 'center';

    const array = text.split(/<br>/i);
    const lineHeight = 50;
    const x = canvas.width / 2;
    let y = (canvas.height - ((array.length - 1) * lineHeight)) / 2;

    for (let i = 0; i < array.length; i++) {
      context.fillText(array[i], x, y);

      y += lineHeight;
    }

    const scoreGeometry = new PlaneGeometry(10, 5);
    const scoreTexture = new Texture(canvas);
    const scoreMaterial = new MeshBasicMaterial({
      map: scoreTexture,
      transparent: true
    });

    this.text = new Mesh(scoreGeometry, scoreMaterial);
    this.text.position.y = 0;
    this.text.position.z = 0.01;
    this.text.material.map.needsUpdate = true;

    this.add(this.text);
  }
}
