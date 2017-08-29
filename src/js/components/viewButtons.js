function enterFullscreen (el) {
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

export function bindButtons (renderer, vrDisplay) {
  document.querySelector('button#fullscreen').addEventListener('click', () => {
    enterFullscreen(renderer);
  });

  document.querySelector('button#vr').addEventListener('click', () => {
    vrDisplay.requestPresent([
      { source: renderer }
    ]);
  });

  document.querySelector('button#reset').addEventListener('click', () => {
    vrDisplay.resetPose();
  });
}
