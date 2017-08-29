/* global require */

import 'babel-core/register';
import 'babel-polyfill';

import NoSleep from 'nosleep.js';

import { WebGLRenderer } from 'three';
import { Game } from './game';
import StartScreen from './components/startScreen';
import { Fonts } from './components/fonts';
import VersionInfo from './components/versionInfo';
import MuteButton from './components/muteButton';
import VrButton from './components/vrButton';
import { preloader } from './utils/preloader';
import { windowRef } from './utils/windowRef';
import browser from './utils/browser';
import { audioController } from './utils/audioController';
import { getParam } from './utils/query';
import analytics from './utils/analytics';

class App {
  static PRELOADER_MIN_TIME = 6000;

  constructor () {
    this.domElement = document.querySelector('#app');

    this.noSleep = new NoSleep();
    this.noSleep.enable();

    const versionInfo = new VersionInfo();

    this.domElement.appendChild(versionInfo.domElement);

    this.runPerformanceTest();

    if (this.validateBrowser()) {
      this.initLoader();
    }

    if (browser.getOs() === 'android') {
      const currHeight = window.innerHeight;

      this.domElement.style.height = `${currHeight}px`;
    } else {
      document.body.style.position = 'fixed';
      document.body.style.bottom = '0';

      let elHeight = 0;

      setInterval(() => {
        const currHeight = window.innerHeight;

        if (elHeight !== currHeight) {
          document.body.style.height = `${currHeight}px`;
          this.domElement.style.height = `${currHeight}px`;
          elHeight = currHeight;
        }
      }, 500);
    }

    window.addEventListener('resize', this.onResize.bind(this));
  }

  initLoader () {
    this.enablePreloader();

    preloader.startTimeStamp = Date.now();

    preloader.addEventListener('complete', (e) => {
      const preloadingDuration = e.timeStamp - preloader.startTimeStamp;
      const preloaderDelay = Math.max(App.PRELOADER_MIN_TIME - preloadingDuration, 1);

      setTimeout(() => {
        this.init();
      }, preloaderDelay);
    });

    preloader.loadManifest('assets/data/manifest.json');

    if (preloader.extras) {
      preloader.loadManifest('assets/data/manifest-extras.json');
    }
  }

  init () {
    const renderer = new WebGLRenderer({
      antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    this.domElement.appendChild(renderer.domElement);

    this.currentScene = new Game(renderer);

    const font = new FontFace(Fonts.brandon.name, `url(${Fonts.brandon.src})`);

    font.load().then(() => {
      this.startScreen = new StartScreen();
      this.currentScene.add(this.startScreen);
      this.startScreen.position.z = -20;
      this.startScreen.addEventListener(StartScreen.EVENT_BEGIN, this.onBegin.bind(this));
      this.startScreen.animateIn();

      window.addEventListener(StartScreen.EVENT_SWITCH_VR, this.onVRSwitch.bind(this));
      window.addEventListener('vrdisplaypresentchange', this.onVRModeChanged.bind(this));
      document.addEventListener('touchstart', this.enableNoSleep.bind(this), false);

      audioController.init();

      this.validateOrientation();

      const muteBtn = new MuteButton();

      this.domElement.appendChild(muteBtn.domElement);

      const vrBtn = new VrButton();

      this.domElement.appendChild(vrBtn.domElement);

      this.disablePreloader();
    });
  }

  launchIntoFullscreen (element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }

  animate () {
    this.currentScene.animate();
  }

  onBegin () {
    this.startScreen.animateOut()
      .then(() => {
        this.currentScene.remove(this.startScreen);
        this.startScreen.dispose();
        this.startScreen = null;
        this.currentScene.start();
        analytics.tag('game', 'start');
      });
  }

  onVRSwitch () {
    this.currentScene.vrDisplay.requestPresent([{ source: this.currentScene.renderer.domElement }]);
    this.launchIntoFullscreen(document.documentElement);
  }

  onResize () {
    if (browser.getOs() === 'android') {
      const currHeight = window.innerHeight;
      this.domElement.style.height = `${currHeight}px`;
    }

    this.validateOrientation();
  }

  enableNoSleep () {
    this.noSleep.enable();
    document.removeEventListener('touchstart', this.enableNoSleep, false);
  }

  enablePreloader () {
    document.querySelector('#loadingScreen').classList.add('loading--progress');
  }

  disablePreloader () {
    document.querySelector('#loadingScreen').classList.remove('loading--progress');
  }

  validateOrientation () {
    if (!windowRef.isLandscape() && browser.isMobile() && !document.body.classList.contains('desktop')) {
      document.body.classList.add('rotate');
      this.currentScene.pause();
      audioController.pause();
    } else {
      document.body.classList.remove('rotate');
      if (this.currentScene && this.currentScene.gameRunning) {
        this.currentScene.start(true);
      }
      audioController.unpause();
    }
  }

  validateBrowser () {
    if ((!browser.isMobile() && !window.DEV) || browser.isTablet()) {
      document.body.classList.add('desktop');

      return false;
    } else if (browser.isSocialBrowser()) {
      document.body.classList.add('unsupported');
      document.body.classList.add('social');
      document.querySelector('#unsupportedDisclaimer .ctaContinue').addEventListener('click', this.onContinue.bind(this));
    } else if (
      browser.isMobile() &&
      !(browser.getOs() === 'ios' && browser.getBrowser() === 'safari') &&
      !(browser.getOs() === 'android' && browser.getBrowser().toLowerCase().indexOf('chrome') > -1)) {
      document.body.classList.add('unsupported');
      document.querySelector('#unsupportedDisclaimer .ctaContinue').addEventListener('click', this.onContinue.bind(this));
    }

    return true;
  }

  onContinue () {
    document.body.classList.remove('unsupported', 'desktop');
  }

  onVRModeChanged () {
    if (this.currentScene.vrDisplay.isPresenting) {
      document.body.classList.add('vrmode');
      analytics.tag('vrmode', 'enabled');
    } else {
      document.body.classList.remove('vrmode');
      analytics.tag('vrmode', 'disabled');
    }
  }

  runPerformanceTest () {
    const time = Date.now();
    const threshold = 230;

    for (let i = 0; i < 10; i += 1) {
      this.getTak();
    }

    const elapsed = Date.now() - time;

    if (elapsed < threshold) {
      preloader.extras = true;
    }

    if (!window.DEV) {
      return;
    }

    if (getParam('get') === 'high') {
      preloader.extras = true;
    }

    if (getParam('get') === 'low') {
      preloader.extras = false;
    }

    const label = (preloader.extras) ? 'HIGH' : 'LOW';
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.bottom = '24px';
    el.style.right = 0;
    el.style.background = 'white';
    el.style.padding = '6px';
    el.style.fontSize = '10px';
    el.innerHTML = `TAK ${elapsed} / ${threshold} : ${label}`;
    document.body.appendChild(el);
  }

  getTak () {
    return this.tak(17, 13, 6);
  }

  tak (x, y, z) {
    return (x <= y) ? y : this.tak(this.tak(x - 1, y, z), this.tak(y - 1, z, x), this.tak(z - 1, x, y));
  }
}

/* eslint-disable no-new */
new App();
