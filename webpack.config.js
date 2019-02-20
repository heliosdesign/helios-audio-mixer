const path = require('path')
const webpack = require('webpack')

const packageInfo = require('./package.json')

const environment  = process.env.NODE_ENV || 'development'
const isProduction = environment === 'production'

let libraryConfig = {
  mode: environment,
  entry: {
    'audioMixer': './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, './'),
    filename: isProduction? '[name].min.js' : '[name].js',
    library:  '[name]',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this' // https://github.com/webpack/webpack/issues/6642
  },
  resolve: {
    modules: [
      path.resolve(__dirname, './src'),
      'node_modules'
    ]
  },
  module: {
    rules: [
      {
        test:    /\.js$/,        // files ending with .js
        exclude: /node_modules/, // exclude the node_modules directory
        use: {
          loader:  'babel-loader', // use this (@babel/core) loader
          options: {
            presets: [
              '@babel/preset-env'
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      ENV:     JSON.stringify(environment),
      VERSION: JSON.stringify(packageInfo.version)
    })
  ],
  devtool: isProduction ? 'source-map' : 'eval-source-map'
}

if (isProduction) {
  libraryConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env': { // Set the environment specifically for plugins
        'NODE_ENV': JSON.stringify('production')
      }
    })
  )
}

module.exports = libraryConfig
