/*

  webpack for demo (not main library)

*/

const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const basePath = './docs/demo'

let config = {
  entry: {
    'bundle': `${basePath}/js/demo.js`
  },
  output: {
    path: path.resolve(__dirname, basePath),
    filename: 'bundle.js'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, `${basePath}/js`),
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
      },
      {
        test: /\.sass$/,
        use: [
          'css-hot-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: loader => [
                require('autoprefixer')()
              ],
              minimize: true
            }
          },
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.css'
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, basePath),
    historyApiFallback: true,
    inline: true,
    open: true
  },
  devtool: 'eval-source-map'
}

module.exports = config
