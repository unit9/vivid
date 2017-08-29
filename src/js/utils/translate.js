class Translate {
  get(key) {
    const element = document.querySelector(`#${key}`);

    return element ? element.innerHTML : key;
  }
}

export let translate = new Translate();
