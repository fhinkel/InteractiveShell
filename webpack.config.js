var webpack = require("webpack");

module.exports = {
  entry: "./public-source/mathProgram.js",
  output: {
    path: __dirname,
    filename: "public/public-common/mathProgram.js"
  },
  module: {
    loaders: [
      {test: /\.css$/, loader: "style!css"}
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    })
  ]
};