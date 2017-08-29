/**
 * Created by krzysztofnowak on 03/07/2017.
 */
import 'yuki-createjs'

import Visibility from 'visibilityjs';

class AudioControllerClass {
  constructor() {
    this.playing = new Map();
    this.muted = false;
    this.paused = false;

    // pause/resume with page visibility
    Visibility.change((e, state) => {
      if (Visibility.hidden()) {
        this.pause();
      } else {
        this.unpause();
      }
    });
  }

  init() {
    if (createjs.Sound.activePlugin instanceof createjs.WebAudioPlugin &&
      createjs.Sound.activePlugin.context.state === 'suspended') {
      console.log('initial state === suspended');
      this.muted = true;
    }
  }

  play(name, params) {
    // console.log('AudioController:play', name, params);

    if (!params) params = {};
    if (params.loop === undefined) params.loop = false;
    if (params.crossLoop === undefined) params.crossLoop = false;
    if (params.volume === undefined) params.volume = 1;
    if (params.forcePlaying === undefined) params.forcePlaying = false;

    const loop = (params.loop) ? -1 : 0;
    const volume = params.volume;

    if (params.forcePlaying) {
      // This condition checks whether file is loaded and registered for playing.
      // Without it the very first audio may not played as it is not yet ready
      const mySoundSrc = createjs.Sound._getSrcById(name).src;
      if (mySoundSrc !== name && !createjs.Sound.loadComplete(mySoundSrc)) {
        setTimeout(() => {
          createjs.Sound.registerSound(mySoundSrc, name);
          this.play(name, params);
        }, 100);
        return;
      }
    }

    const player = createjs.Sound.play(name, {loop, volume});
    player.name = name;
    player.muted = this.muted;
    player.paused = this.paused;

    // cross loop: attempt to get seamless loop
    // by playing the same file again 0.1s before the previous one ends
    if (params.crossLoop) {
      player.volume = 0;
      TweenMax.to(player, 0.1, { volume });

      player.delayedLoop = TweenMax.delayedCall(
        player.duration * 0.001 - 0.1,
        this.onCrossLoop.bind(this),
        [player, params]
      );

      player.delayedLoop.muted = this.muted;
    }

    if ( params.onComplete ) {
      player.on('complete', params.onComplete, this);
    }

    this.playing.set(name, player);

    return player;
  }

  onCrossLoop(player, params) {
    // console.log('AudioController.onCrossLoop', player);
    this.play(player.name, params);
  }

  stop(name) {
    // console.log('AudioController:stop', name);
    if (this.playing.get(name)) {
      if (this.playing.get(name).delayedLoop) this.playing.get(name).delayedLoop.kill();
      this.playing.get(name).stop();
      this.playing.delete(name);
    }
  }

  stopAll() {
    // console.log('AudioController:stopAll');
    for (let [name, player] of this.playing) {
      player.stop();
    }
    this.playing.clear();
  }

  mute() {
    // console.log('AudioController:mute');
    if (this.muted) return;

    this.muted = true;
    for (let [name, player] of this.playing) {
      player.muted = true;
    }
  }

  unmute() {
    // console.log('AudioController:unmute');
    if (createjs.Sound.activePlugin instanceof createjs.WebAudioPlugin &&
      createjs.Sound.activePlugin.context.state === 'suspended') {
      this.muted = true;
      return;
    }

    this.muted = false;

    for (let [name, player] of this.playing) {
      if (player.muted) player.muted = false;
      // if (player.delayedLoop && player.delayedLoop.paused) player.delayedLoop.resume();
    }
  }

  pause() {
    // console.log('AudioController:pause');
    if (this.paused) return;

    this.paused = true;
    for (let [name, player] of this.playing) {
      player.paused = true;
      if (player.delayedLoop) player.delayedLoop.pause();
    }
  }

  unpause() {
    // console.log('AudioController:unpause');
    this.paused = false;

    for (let [name, player] of this.playing) {
      if (player.paused) player.paused = false;
      if (player.delayedLoop && player.delayedLoop.paused) player.delayedLoop.resume();
    }
  }
}

export let audioController = new AudioControllerClass();
