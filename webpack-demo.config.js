/*

  webpack for demo (not main library)

*/
const path = require('path')
const webpack = require('webpack')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')

let config = {

  entry: {
    'bundle': './demo/js/demo.js',
  },
  output: {
    path: path.resolve(__dirname, 'demo'),
    filename: 'bundle.js',
  },

  resolve: {
    modules: [path.resolve(__dirname, './demo/js'), 'node_modules'],
  },

  module: {
    rules: [
      {
        test:    /\.js$/,        // files ending with .js
        exclude: /node_modules/, // exclude the node_modules directory
        loader:  'babel-loader', // use this (babel-core) loader
        query:   { presets: ['env'] },
      },
      {
        test: /\.sass$/,
        use: ['css-hot-loader'].concat(ExtractTextWebpackPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        }))
      },
    ]
  },

  plugins: [
    // Used to convert the CSS/SASS into an actual file instead of inlining
    new ExtractTextWebpackPlugin(`style.css`),
  ],


  devServer: {
    contentBase: path.resolve(__dirname, './demo'),
    historyApiFallback: true,
    inline: true,
    open: true
  },

  devtool: 'eval-source-map',

}

module.exports = config
