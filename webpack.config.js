var path = require('path');
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|build)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env',"react"],
            plugins: [
    "transform-object-rest-spread",
    "transform-react-jsx",
    "transform-class-properties",
    "transform-runtime",
    "transform-async-to-generator"
  ]
          }
        }
      }
    ]
  },
  externals: {
    'react': 'commonjs react'
  }
};