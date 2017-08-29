/* global dat, require */

import { Texture, LinearFilter, RGBAFormat, RGBFormat, Clock, Raycaster, Object3D, Vector2, PointLight, MeshPhongMaterial, MeshBasicMaterial, JSONLoader, Mesh, BackSide } from 'three';
import { Crosshair } from './components/crosshair';
import { VREffect } from './utils/VREffect';
import { VRControls } from './utils/VRControls';
import { SceneTemplate } from './components/sceneTemplate';
import { Rocket } from './components/rocket';
import { Skybox } from './components/skybox';
import { Score } from './components/score';
import { Fireworks } from './components/fireworks';
import ScoreBar from './components/scoreBar';
import { random, randomInt } from './utils/math';
import GazeEvent from './utils/gazeEvent';
import '../../node_modules/webvr-polyfill/build/webvr-polyfill';
import { audioController } from './utils/audioController';
import { EndScreen } from './components/endScreen/endScreen';
import { preloader } from './utils/preloader';

import Visibility from 'visibilityjs';
import analytics from './utils/analytics';

const CANNON = require('cannon');
const COLORS = ['blue', 'pink', 'yellow'];

export class Game extends SceneTemplate {
  static DIFFICULTY_CHANGE_RATE = 5;
  static ANGLE_CHANGE_RATE = 2;
  static COOLDOWN_CHANGE_RATE = 0.05;
  static INVINCIBILITY = false;

  constructor (renderer) {
    super(renderer);

    this.rockets = [];
    this.explosions = [];
    this.highlightedRockets = [];
    this.gazableObjects = [];
    this.gazedObjects = [];
    this.lastHighlightedRocket = null;
    this.clock = new Clock();
    this.tick = 0;
    this.isPaused = false;
    this.gameRunning = false;
    this.objectContainer = new Object3D();
    this.raycaster = new Raycaster();

    this.angle = 56 / 2;
    this.cooldown = 4;
    this.cooldownTimer = this.cooldown;
    this.difficultyTimer = Game.DIFFICULTY_CHANGE_RATE;

    this.mouseVector = new Vector2(0, 0);
    this.rocketBatch = 0;

    this.onRocketGazeOver = this.onRocketGazeOver.bind(this);
    this.onResize = this.onResize.bind(this);
    this.vrDisplayPresentChange = this.vrDisplayPresentChange.bind(this);

    const skybox = new Skybox();

    this.scene.background = skybox.cubeTexture;

    const loader = new JSONLoader();

    let material = new MeshPhongMaterial({
      color: 0x221c43,
      side: BackSide
    });

    if (!preloader.extras) {
      const texture = new Texture(preloader.getResult(`terrain-map`));

      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.format = RGBFormat;
      texture.needsUpdate = true;

      material = new MeshBasicMaterial({
        color: 0xFFFFFF,
        side: BackSide,
        map: texture
      });
    }

    loader.load('assets/models/terrain-new.json', (geometry, materials) => {
      const object = new Mesh(geometry, material);

      object.position.y = -250;
      object.scale.set(30, 30, 30);
      object.rotation.z = -180 * Math.PI / 180;

      this.scene.add(object);
    });

    this.score = new Score();
    this.gameOver = this.gameOver.bind(this);
    this.restart = this.restart.bind(this);
    this.score.addEventListener('gameOver', this.gameOver);

    this.scoreBar = new ScoreBar(this.score);
    this.scoreBar.position.z = -13;
    this.scoreBar.position.y = -5;
    this.camera.add(this.scoreBar);

    let light = new PointLight(0xffffff, 5, 100);

    light.position.set(0, 50, -50);

    this.scene.add(light);

    light = new PointLight(0xffffff, 5, 1000);
    light.position.set(0, 500, 0);

    this.scene.add(light);

    this.crosshair = new Crosshair();
    this.camera.add(this.crosshair);
    this.scene.add(this.camera);
    this.scene.add(this.objectContainer);

    this.controls = new VRControls(this.camera);
    this.effect = new VREffect(this.renderer);
    this.effect.setSize(window.innerWidth, window.innerHeight);

    this.vrDisplay = null;

    navigator.getVRDisplays().then((displays) => {
      if (displays.length > 0) {
        this.vrDisplay = displays[0];
        this.world = this.setupWorld();
        this.fixedTimeStep = 1.0 / 60.0;
        this.maxSubSteps = 3;
        this.addListeners();
        this.vrDisplay.requestAnimationFrame(this.animate);
      }
    });

    if (window.DEV) {
      const gui = new dat.GUI();

      gui.add(Game, 'INVINCIBILITY');
      gui.add(this, 'isPaused');
    }

    this.createTexturePool();
    this.createRocketPool(9);

    this.pause();
  }

  setupWorld () {
    const world = new CANNON.World();

    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.gravity.set(0, -15, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.broadphase.useBoundingBoxes = true;

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({mass: 0, collisionFilterGroup: 1, collisionFilterMask: 2});

    groundBody.allowSleep = true;
    groundBody.position.set(0, -25, 0);
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.allowSleep = true;

    world.add(groundBody);

    return world;
  }

  start (resume) {
    this.gameRunning = true;
    this.isPaused = false;

    if (!this.scoreBar.isVisible) {
      this.scoreBar.animateIn();
    }

    if (!resume) {
      this.clock.start();
    }
  }

  pause () {
    this.isPaused = true;

    if (this.gameRunning) {
      this.cooldownTimer -= this.clock.elapsedTime;
      this.difficultyTimer -= this.clock.elapsedTime;
    }

    this.clock.stop();
  }

  gameOver () {
    this.rockets.forEach(rocket => {
      if (rocket.isActive) {
        this.destroyRocket(rocket);
      }
    });

    this.pause();

    this.scoreBar.animateOut();

    audioController.stop('game_theme');

    if (this.endScreen) {
      return;
    }

    this.endScreenContainer = new Object3D();
    this.endScreen = new EndScreen(this.score.score, this.score.highScore);
    this.endScreen.addEventListener('gameRestart', this.restart);
    this.endScreen.position.z = -20;
    this.endScreenContainer.add(this.endScreen);

    this.add(this.endScreenContainer);

    this.endScreen.animateIn();

    analytics.tag('game', 'over');
  }

  restart () {
    this.remove(this.endScreenContainer);

    this.endScreenContainer.remove(this.endScreen);
    this.endScreen.removeEventListener('gameRestart', this.restart);
    this.endScreen.dispose();
    this.endScreen = null;
    this.endScreenContainer = null;

    this.angle = 56 / 2;
    this.cooldown = 4;
    this.cooldownTimer = this.cooldown;
    this.difficultyTimer = Game.DIFFICULTY_CHANGE_RATE;
    this.score.restart();
    this.start();

    audioController.play('game_theme', {crossLoop: true});

    this.rocketBatch = 0;

    analytics.tag('game', 'restart');
  }

  add (obj) {
    this.objectContainer.add(obj);

    obj.traverse(child => {
      if (child.isGazable) {
        this.gazableObjects.push(child);
      }
    });
  }

  remove (obj) {
    this.objectContainer.remove(obj);

    obj.traverse(child => {
      if (child.isGazable) {
        const index = this.gazableObjects.indexOf(child);

        if (index !== -1) {
          this.gazableObjects.splice(index, 1);
        }
      }
    });
  }

  spawnRocket (timeElapsed) {
    if (timeElapsed > this.cooldownTimer) {
      let ROCKET_AMOUNT = 3;
      const COLOR_INDEX = Math.floor(Math.random() * 3);
      const angles = this.getRocketAngles(this.angle);

      for (const angle of angles) {
        for (const rocket of this.rockets) {
          if (!rocket.isActive && ROCKET_AMOUNT > 0) {
            rocket.activate(COLORS[COLOR_INDEX], angle, this.rocketBatch);
            rocket.addEventListener('gazeover', this.onRocketGazeOver);

            this.world.add(rocket.body);

            rocket.visible = true;

            ROCKET_AMOUNT -= 1;
            break;
          }
        }
      }

      this.cooldownTimer += this.cooldown;

      this.rocketBatch++;
    }
  }

  destroyRocket (rocket) {
    const hitRocketsIndex = this.highlightedRockets.indexOf(rocket);

    if (hitRocketsIndex !== -1) {
      this.highlightedRockets.splice(hitRocketsIndex, 1);
    }

    this.world.removeBody(rocket.body);

    rocket.visible = false;
    rocket.removeEventListener('gazeover', this.onRocketGazeOver);
    rocket.deactivate();
  }

  animate () {
    const delta = this.clock.getDelta();

    this.vrDisplay.requestAnimationFrame(this.animate);
    this.controls.update();
    this.gaze();
    this.scoreBar.update();

    if (!this.isPaused) {
      this.world.step(this.fixedTimeStep, delta, this.maxSubSteps);
      this.checkRockets(delta);
      this.score.comboCounterUpdate(delta);
      this.changeDifficulty(this.clock.elapsedTime);
      this.spawnRocket(this.clock.elapsedTime);
      this.checkExplosions();
      this.scoreBar.update(delta);
    }

    this.render();
  }

  render () {
    this.effect.render(this.scene, this.camera);
  }

  gaze () {
    const currentGazedObjects = [];
    let intersects = [];

    this.raycaster.setFromCamera(this.mouseVector, this.camera);

    this.gazableObjects.forEach(obj => {
      intersects = intersects.concat(this.raycaster.intersectObject(obj, false));
    });

    intersects.forEach(intersection => {
      const obj = intersection.object;

      currentGazedObjects.push(obj);

      if (this.gazedObjects.indexOf(obj) === -1) {
        const event = new GazeEvent('gazeover', {intersection});

        this.gazedObjects.push(obj);

        obj.dispatchEvent(event);
      }
    });

    const gazedOutObjects = [];

    this.gazedObjects.forEach(obj => {
      if (currentGazedObjects.indexOf(obj) === -1 || !obj.parent) {
        if (obj.parent) {
          const event = new GazeEvent('gazeout');

          obj.dispatchEvent(event);
        }

        gazedOutObjects.push(obj);
      }
    });

    gazedOutObjects.forEach(obj => {
      this.gazedObjects.splice(this.gazedObjects.indexOf(obj), 1);
    });
  }

  checkRockets (dt) {
    const preComboRocketsHit = this.highlightedRockets.length;

    this.rockets.forEach(rocket => {
      if (rocket.isActive) {
        rocket.update(dt);
      }

      if (rocket.isDead) {
        if (!Game.INVINCIBILITY) {
          this.score.breakCombo();
        } else {
          const explosion = new Fireworks(rocket.colorName, rocket.position);

          explosion.addEventListener('fireworks:complete', this.onFireworksComplete.bind(this));

          const scale = random(0.02, 0.15);

          explosion.scale.set(scale, scale, scale);
          explosion.explode();

          audioController.play(`explosion${randomInt(1, 3)}`);

          this.explosions.push(explosion);
          this.scene.add(explosion);
          this.score.hit();
        }

        this.destroyRocket(rocket);
      }
    });

    if (preComboRocketsHit > 0 && !(preComboRocketsHit > this.highlightedRockets.length)) {
      this.score.increaseDelta(dt);
    } else {
      this.lastHighlightedRocket = null;
    }

    if (this.highlightedRockets.length === 3) {
      while (this.highlightedRockets.length !== 0) {
        const rocket = this.highlightedRockets[0];
        const explosion = new Fireworks(rocket.colorName, rocket.position);
        explosion.addEventListener('fireworks:complete', this.onFireworksComplete.bind(this));
        const scale = random(0.02, 0.15);
        explosion.scale.set(scale, scale, scale);
        explosion.explode();
        audioController.play(`explosion${randomInt(1, 3)}`);
        this.explosions.push(explosion);
        this.scene.add(explosion);
        this.destroyRocket(rocket);
      }

      this.score.hit();

      this.lastHighlightedRocket = null;

      this.highlightedRockets = [];
    }
  }

  checkExplosions () {
    for (let i = 0; i < this.explosions.length; i++) {
      if (this.explosions[i].children.length === 0) {
        this.scene.remove(this.explosions[i]);
        this.explosions[i] = null;
        this.explosions.splice(i, 1);
        i -= 1;
      }
    }
  }

  changeDifficulty (timeElapsed) {
    if (timeElapsed > this.difficultyTimer) {
      if (this.angle < 180) {
        this.angle += Game.ANGLE_CHANGE_RATE;
      }

      this.cooldown -= Game.COOLDOWN_CHANGE_RATE;
      this.difficultyTimer += Game.DIFFICULTY_CHANGE_RATE;
    }
  }

  vrDisplayPresentChange (e) {
    this.onResize();
  }

  addListeners () {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('vrdisplaypresentchange', this.vrDisplayPresentChange);

    Visibility.change((e, state) => {
      if (!this.gameRunning) {
        return;
      }

      if (Visibility.hidden()) {
        this.pause();
      } else {
        this.start(true);
      }
    });
  }

  onRocketGazeOver (event) {
    const rocket = event.target;

    if (this.lastHighlightedRocket && rocket.colorName > this.lastHighlightedRocket.colorName) {
      this.lastHighlightedRocket = null;

      while (this.highlightedRockets.length) {
        const r = this.highlightedRockets.shift();

        r.smother();
        r.disconnect();
      }
    }

    if (!this.lastHighlightedRocket || (this.lastHighlightedRocket.colorName === rocket.colorName && !rocket.isHighlighted)) {
      rocket.highlight();
      rocket.connectTo(this.crosshair);

      if (this.lastHighlightedRocket) {
        this.lastHighlightedRocket.connectTo(rocket);
      }

      this.lastHighlightedRocket = rocket;
      this.highlightedRockets.push(rocket);

      audioController.play(`select${this.highlightedRockets.length}`);
    }
  }

  onFireworksComplete (e) {
    const fireworks = e.target;

    fireworks.dispose();

    this.scene.remove(fireworks);
  }

  onResize () {
    this.effect.setSize(window.innerWidth, window.innerHeight);

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  getRocketAngles (angle) {
    let left, right;

    const range = angle - 30;

    let base = Math.random() * range;

    if (base > range / 2) {
      right = base + random(15, 30);
      left = base - random(15, 30);
      left = left < 0 ? left + 360 : left;
    } else {
      base = 360 - base;
      right = base + random(15, 30);
      right = right > 360 ? right - 360 : right;
      left = 360 - random(15, 30);
    }

    return [base, left, right];
  }

  createRocketPool (amount) {
    for (let i = 0; i < amount; i++) {
      const rocket = new Rocket(Rocket.COLOR_BLUE, 0, this.camera);

      this.rockets.push(rocket);
      this.rockets[i].visible = false;

      this.add(this.rockets[i]);
    }
  }

  createTexturePool () {
    preloader.textures = {};

    const colorNames = [
      Rocket.COLOR_BLUE,
      Rocket.COLOR_PINK,
      Rocket.COLOR_YELLOW
    ];

    let texture = null;

    for (let i = 0; i < colorNames.length; i++) {
      const colorName = colorNames[i];

      texture = new Texture(preloader.getResult(`rocket-trail-${colorName}-spritesheet`));
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.format = RGBAFormat;
      texture.needsUpdate = true;

      preloader.textures[`rocket-trail-${colorName}`] = texture;

      texture = new Texture(preloader.getResult('rocket-ember'));
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.format = RGBAFormat;
      texture.needsUpdate = true;

      preloader.textures['rocket-ember'] = texture;

      if (preloader.extras) {
        texture = new Texture(preloader.getResult(`rocket-smoke-${colorName}-spritesheet`));
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.format = RGBAFormat;
        texture.needsUpdate = true;

        preloader.textures[`rocket-smoke-${colorName}`] = texture;
      }

      if (preloader.extras) {
        texture = new Texture(preloader.getResult(`rocket-takeoff-${colorName}-spritesheet`));
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.format = RGBAFormat;
        texture.needsUpdate = true;

        preloader.textures[`rocket-takeoff-${colorName}`] = texture;
      }
    }
  }
}
