export default class GazeEvent {
  constructor(type, data) {
    this.type = type;
    this.data = data;
    this.target = null;
    this.propagationStopped = false;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }
}
