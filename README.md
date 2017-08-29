# VIVID
> UNIT9 presents VIVID. A WebVR experiment, where users make fireworks explode by matching three rockets of the same colour.

### Vivid pushes the boundaries of WebVR
With [Vivid](http://vivid.unit9.com/), UNIT9 Digital has pushed the boundaries of WebVR. Using real time graphics built in WebGL, the team have created a stunning WebVR experiment. You simply need a smartphone and cardboard and you can begin a fireworks display in WebVR. Give it a try [here](http://vivid.unit9.com/) on your smartphone.

![WebVR Experiment](https://d2z8nyy70yf33i.cloudfront.net/wp-content/uploads/vivid.png)

## Getting Started
```sh
# Clone the project.
git clone https://github.com/unit9/vivid.git

# Enter the project directory.
cd vivid

# Install npm dependencies.
npm install

# Initialize development server at localhost:8080.
npm run dev
```

## NPM Scripts

### Development
```
npm run dev
```

Spins up a Webpack development server at [localhost:8080](http://localhost:8080/) and keeps track of all JavaScript and SASS changes to files. Only reloads automatically upon save of JavaScript files.

### Build
```
npm run build
```

Cleans existing build folder while linting JavaScript folder and then copies over the `public` folder from `src`. Then sets environment to production and compiles JavaScript and CSS into build.

### Other
You can run any of these individually if you'd like with the npm run command:
* `prebuild` - Cleans build folder and lints `src/js` folder using `semi-standard`.
* `clean` - Cleans the build folder.
* `lint` - Runs lint on `src/js` folder and uses `.eslintrc` file in root as linting rules.
* `webpack-server` - Create `webpack-dev-server` with `hot-module-replacement`.
* `webpack-watch` - Run Webpack in development environment with watch.
* `dev:sass` - Run `node-sass` on `src/css` folder and output to `src/public` and watch for changes.
* `dev:js` - Run Webpack in development environment without watch.
* `build:dir` - Copy files and folders from `src/public` to `build`.
* `build:sass` - Run `node-sass` on `src/css` and output compressed CSS to `build` folder.
* `build:js` - Run Webpack in production environment.
