/**
 * Created by nowak on 05/07/2017.
 */

class WindowRef {
  constructor() {
    this.window = window;
  }

  isLandscape() {
    return this.window.innerHeight < this.window.innerWidth;
  }
}

export let windowRef = new WindowRef();