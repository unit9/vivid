import {
  Color,
  EventDispatcher,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RGBAFormat,
  Texture
} from 'three';

import {
  Power3,
  TimelineMax,
  TweenMax
} from 'gsap';

import {
  Colors
} from './comboBarColors';

import {
  preloader
} from '../utils/preloader';

import {
  mapValue,
  randomInt
} from '../utils/math';

export class Bars extends EventDispatcher {
  static OBJECT_POSITION_X = -8;
  static OBJECT_POSITION_Y = -0.75;
  static OBJECT_SCALE_X = 0.12;
  static OBJECT_SCALE_Y = 0.1;

  constructor () {
    super();

    this.mainColor = {
      r: 0,
      g: 255,
      b: 210
    };

    const material = new MeshBasicMaterial({
      color: new Color(this.mainColor.r, this.mainColor.g, this.mainColor.b),
      transparent: true,
      opacity: 0.2,
      depthTest: false
    });

    const geometry = new PlaneGeometry(100, 10, 5);

    geometry.translate(50, 5, 0);

    this.backgroundMesh = new Mesh(geometry, material);

    const materialScore = new MeshBasicMaterial({
      color: new Color(0, 0, 0),
      transparent: true,
      opacity: 0.2,
      depthTest: false
    });

    const geometryScore = new PlaneGeometry(40, 10, 5);

    geometryScore.translate(50, 5, 0);

    this.backgroundScoreMesh = new Mesh(geometryScore, materialScore);
    this.backgroundScoreMesh.position.x = 70;
    this.backgroundScoreMesh.position.z = -0.01;

    const texture = new Texture(preloader.getResult('pointer'));

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBAFormat;
    texture.flipY = true;
    texture.needsUpdate = true;

    const materialPointer = new MeshBasicMaterial({
      color: new Color(this.mainColor.r, this.mainColor.g, this.mainColor.b),
      transparent: true,
      map: texture,
      depthTest: false
    });

    const geometryPointer = new PlaneGeometry(37, 294);

    this.pointer = new Mesh(geometryPointer, materialPointer);
    this.pointer.renderOrder = 1;
    this.pointer.scale.set(0.045, 0.045, 1);
    this.pointer.position.x = 100;
    this.pointer.position.y = 5;
    this.pointer.position.z = 0.01;

    const materialScorePointer = new MeshBasicMaterial({
      transparent: true,
      map: texture,
      depthTest: false
    });

    const geometryScorePointer = new PlaneGeometry(37, 294);

    this.scorePointer = new Mesh(geometryScorePointer, materialScorePointer);
    this.scorePointer.scale.set(0.045, 0.045, 1);
    this.scorePointer.position.y = 5;
    this.scorePointer.position.z = 0.5;

    this.container = new Object3D();
    this.lines = new Object3D();

    this.container.add(this.backgroundScoreMesh);
    this.container.add(this.backgroundMesh);
    this.container.add(this.pointer);
    this.container.add(this.scorePointer);

    this.container.position.x = Bars.OBJECT_POSITION_X;
    this.container.position.y = Bars.OBJECT_POSITION_Y;
    this.container.scale.set(Bars.OBJECT_SCALE_X, Bars.OBJECT_SCALE_Y, 1);

    this.lines.position.x = Bars.OBJECT_POSITION_X;
    this.lines.position.y = Bars.OBJECT_POSITION_Y;
    this.lines.scale.set(Bars.OBJECT_SCALE_X, Bars.OBJECT_SCALE_Y, 1);

    this.textureBar1 = new Texture(preloader.getResult('bar1'));
    this.textureBar1.minFilter = LinearFilter;
    this.textureBar1.magFilter = LinearFilter;
    this.textureBar1.format = RGBAFormat;
    this.textureBar1.flipY = true;
    this.textureBar1.needsUpdate = true;

    this.textureBar2 = new Texture(preloader.getResult('bar2'));
    this.textureBar2.minFilter = LinearFilter;
    this.textureBar2.magFilter = LinearFilter;
    this.textureBar2.format = RGBAFormat;
    this.textureBar2.flipY = true;
    this.textureBar2.needsUpdate = true;
  }

  update () {

  }

  moveTo (percantage, multiplier) {
    percantage = percantage > 1 ? 1 : percantage;

    if (this.timeline) {
      this.timeline.kill();
    }

    this.timeline = new TimelineMax({
      onComplete: () => {
        this.dispatchEvent({
          type: 'scoreTweeningComplete'
        });
      }
    });

    this.lines.children.forEach((line) => {
      if (line.multiplier === multiplier) {
        const scale = (percantage + line.widthFactor / 100) > 1 ? 1 : percantage + line.widthFactor / 100;

        this.timeline.insert(
          TweenMax.to(line.scale, 3 - Math.random() * 3, {
            x: scale
          })
        );
      }
    });

    this.timeline.insert(
      TweenMax.to(this.scorePointer.position, 3 - Math.random() * 3, {
        x: percantage * 100
      })
    );
  }

  clearLines (multiplier) {
    const timeline = new TimelineMax({
      onComplete: (multiplier) => {
        this.lines.children.forEach((line) => {
          if (line.multiplier === multiplier) {
            this.container.remove(line);

            line.material.dispose();
            line.geometry.dispose();
            line = null;
          }
        });
      }
    });

    this.lines.children.forEach((line) => {
      if (line.multiplier === multiplier) {
        timeline.insert(
          TweenMax.to(line.scale, 2, {
            x: 1,
            ease: Power3.easeOut
          })
        );

        timeline.insert(
          TweenMax.to(line.material, 2, {
            opacity: 0,
            ease: Power3.easeOut
          })
        );
      }
    });
  }

  createLines (multiplier) {
    for (let i = 0; i < 10; i++) {
      const heightFactor = 3 * Math.random();
      const WidthFactor = Math.random() > 0.5 ? 30 * Math.random() : -30 * Math.random();
      const newColor = this.mapColor(Colors[multiplier - 1]);
      const random = randomInt(0, 2);

      let material;

      if (random === 0) {
        material = new MeshBasicMaterial({
          color: new Color(newColor.r, newColor.g, newColor.b),
          transparent: true,
          opacity: 0.3 + 0.7 * Math.random(),
          depthTest: false
        });
      } else {
        material = new MeshBasicMaterial({
          color: new Color(newColor.r, newColor.g, newColor.b),
          transparent: true,
          opacity: 0.3 + 0.7 * Math.random(),
          map: this[`textureBar${random}`],
          depthTest: false
        });
      }

      const geometry = new PlaneGeometry(100, 1 + heightFactor, 5);

      geometry.translate(50, 2 + 5 * Math.random(), 0);

      const mesh = new Mesh(geometry, material);

      mesh.position.z = 0.1 + i / 100;
      mesh.widthFactor = WidthFactor;
      mesh.multiplier = multiplier;
      mesh.scale.set(0, 1, 1);

      this.lines.add(mesh);
    }
  }

  changeColor (multiplier) {
    TweenMax.to(this.mainColor, 2, {
      r: Colors[multiplier - 1].r,
      g: Colors[multiplier - 1].g,
      b: Colors[multiplier - 1].b,
      ease: Power3.easeOut,
      onUpdate: () => {
        this.mainColor.r = Math.floor(this.mainColor.r);
        this.mainColor.g = Math.floor(this.mainColor.g);
        this.mainColor.b = Math.floor(this.mainColor.b);

        this.backgroundMesh.material.color.setRGB(
          mapValue(Math.floor(this.mainColor.r), 0, 255, 0, 1),
          mapValue(Math.floor(this.mainColor.g), 0, 255, 0, 1),
          mapValue(Math.floor(this.mainColor.b), 0, 255, 0, 1)
        );

        this.pointer.material.color.setRGB(
          mapValue(Math.floor(this.mainColor.r), 0, 255, 0, 1),
          mapValue(Math.floor(this.mainColor.g), 0, 255, 0, 1),
          mapValue(Math.floor(this.mainColor.b), 0, 255, 0, 1)
        );
      }
    });
  }

  setLength (percantage, multiplier) {
    this.lines.children.forEach((line) => {
      if (line.multiplier === multiplier) {
        const scale = (percantage + line.widthFactor / 100) > 1 ? 1 : percantage + line.widthFactor / 100;

        line.scale.set(scale, 1, 1);
      }
    });

    this.scorePointer.position.x = percantage * 100;
  }

  mapColor (color) {
    return {
      r: mapValue(color.r, 0, 255, 0, 1),
      g: mapValue(color.g, 0, 255, 0, 1),
      b: mapValue(color.b, 0, 255, 0, 1)
    };
  }
}
