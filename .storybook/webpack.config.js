const path = require("path");

module.exports = ({config}) => {
  config.module.rules.push({
    test: /\.scss$/,
    use: [
      require.resolve("vue-style-loader"),
      require.resolve("css-loader"),
      require.resolve("sass-loader"),
    ],
  });

  return config;
};