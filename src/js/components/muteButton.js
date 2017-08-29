import {
  preloader
} from '../utils/preloader';

import {
  audioController
} from '../utils/audioController';

export default class MuteButton {
  constructor () {
    this.domElement = null;
    this.domElement = document.createElement('div');
    this.domElement.id = 'muteBtn';
    this.domElement.classList.add('ui-btn');

    const iconMuteOn = preloader.getResult('mute');
    iconMuteOn.className = 'iconMute__on';

    this.domElement.appendChild(iconMuteOn);

    const iconMuteOff = preloader.getResult('mute_off');
    iconMuteOff.className = 'iconMute__off';

    this.domElement.appendChild(iconMuteOff);

    this.domElement.addEventListener('click', this.onClick.bind(this));

    this.updateIcon();
  }

  updateIcon () {
    if (audioController.muted) {
      this.domElement.classList.add('muted');
    } else {
      this.domElement.classList.remove('muted');
    }
  }

  onClick () {
    if (audioController.muted) {
      audioController.unmute();
    } else {
      audioController.mute();
    }

    this.updateIcon();
  }
}
