import 'yuki-createjs'

const preloader = new createjs.LoadQueue();
preloader.installPlugin(createjs.Sound);

export { preloader };