var webpack = require("webpack");

module.exports = {
  entry: "./public-source/index.js",
  output: {
    path: __dirname,
    filename: "public/public-common/index.js"
  },
  module: {
    loaders: [
      {test: /\.css$/, loader: "style!css"}
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ]
};
