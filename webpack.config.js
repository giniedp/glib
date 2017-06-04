const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: path.join(__dirname, 'framework/index.ts'),
  plugins: [

  ],
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'awesome-typescript-loader',
      query: {
        sourceMap: true,
        forkChecker: true,
        transpileOnly: false,
        useTranspileModule: true,
        silent: true,
        configFileName: 'framework/tsconfig.json'
      }
    }]
  },
  cache: true,
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    library: 'Glib',
    filename: 'glib.js',
    sourceMapFilename: 'glib.map'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@glib': path.join(__dirname, 'framework')
    }
  }
};
