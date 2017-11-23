const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const packageInfo = require('./package.json')

const environment  = process.env.NODE_ENV || 'development'
const isProduction = environment === 'production'

let config = {

  entry: {
    'audioMixer': './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, './'),
    filename: isProduction? '[name].min.js' : '[name].js',
    library:  '[name]',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  resolve: {
    modules: [path.resolve(__dirname, './src'), 'node_modules'],
  },

  module: {
    rules: [
      {
        test:    /\.js$/,        // files ending with .js
        exclude: /node_modules/, // exclude the node_modules directory
        loader:  'babel-loader', // use this (babel-core) loader
        query:   { presets: ['env'] },
      },
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      ENV:     JSON.stringify(environment),
      VERSION: JSON.stringify(packageInfo.version)
    })
  ],


  devServer: {
    contentBase: path.resolve(__dirname, './demo'),
    historyApiFallback: true,
    inline: true,
    open: true
  },

  devtool: isProduction ? 'source-map' : 'eval-source-map',

}

if (isProduction) {
  config.plugins.push(

    // need to enable source maps per https://github.com/webpack/webpack/issues/2704
    new webpack.optimize.UglifyJsPlugin({ sourceMap: true }),

    // Set the environment specifically for plugins
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })

  )
}

module.exports = config
