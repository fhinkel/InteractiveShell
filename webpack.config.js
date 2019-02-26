var webpack = require("webpack");

module.exports = {
  entry: "./public-source/index.js",
  output: {
    path: __dirname,
    filename: "public/public-common/index.js"
  },
  mode: 'production',
  module: {
  },
  plugins: [
  ],
  devtool: "source-map"
};
