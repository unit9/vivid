import {
  StartScreen
} from './startScreen/startScreen';

import {
  preloader
} from '../utils/preloader';

export default class VrButton {
  constructor () {
    this.domElement = null;

    this.createDom();

    this.domElement.addEventListener('click', this.onClick.bind(this));
  }

  createDom () {
    this.domElement = preloader.getResult('vr');
    this.domElement.id = 'vrBtn';
    this.domElement.classList.add('ui-btn');
  }

  onClick () {
    window.dispatchEvent(new Event(StartScreen.EVENT_SWITCH_VR));
  }
}
