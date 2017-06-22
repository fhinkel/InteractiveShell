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
  ]
};
