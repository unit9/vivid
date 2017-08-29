// Global imports
var webpack = require('webpack'),
    path    = require('path'),
    HandlebarsPlugin = require("handlebars-webpack-plugin");

// Paths
var entry           = ['babel-polyfill', './src/js/app.js'],
    includePath     = path.join(__dirname, 'src/js'),
    nodeModulesPath = path.join(__dirname, 'node_modules'),
    outputPath      = path.join(__dirname, 'src/public/assets/js');

// Environment
var PROD = process.argv.indexOf('-p') !== -1;

// Dev environment
var env     = 'dev',
    time    = Date.now(),
    devtool = 'eval',
    debug   = true,
    plugins = [
      new webpack.NoErrorsPlugin(),
      new webpack.DefinePlugin({
        __ENV__: JSON.stringify(env),
        ___BUILD_TIME___: time
      }),

      new HandlebarsPlugin({
        entry: path.join(process.cwd(), "src",  "*.hbs"),
        output: path.join(process.cwd(), "src", "public", "[name].html"),
        data: require("./src/copy.json")
      })
    ];

// Production environment
if(PROD) {
  env = 'prod';
  devtool = 'hidden-source-map';
  debug = false;
  outputPath = __dirname + '/build/public/assets/js';

  plugins.push(new webpack.optimize.DedupePlugin());
  plugins.push(new webpack.optimize.OccurenceOrderPlugin());

  uglifyOptions = {
    mangle: true,
    compress: {
      drop_console: true
    }
  };
  plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyOptions));
}

console.log('Webpack build - ENV: ' + env + ' V: ' + time);
console.log('    - outputPath ', outputPath);
console.log('    - includePath ', includePath);
console.log('    - nodeModulesPath ', nodeModulesPath);

module.exports = {
  stats: {
    colors: true
  },
  debug: debug,
  devtool: devtool,
  devServer: {
    contentBase: 'src/public',
    disableHostCheck: true
  },
  entry,
  output: {
    path: outputPath,
    publicPath: 'assets/js',
    filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.(glsl|frag|vert)$/, loader: 'raw', exclude: /node_modules/ },
      { test: /\.(glsl|frag|vert)$/, loader: 'glslify', exclude: /node_modules/ },
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0']
        },
        include: [
          includePath, nodeModulesPath
        ]
      }
    ]
  },
  plugins: plugins
};
