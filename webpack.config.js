const webpack = require('webpack');
const path = require('path');
const IS_COVERAGE = !!process.env.IS_COVERAGE;
const IS_TEST = !!process.env.IS_TEST || IS_COVERAGE;

module.exports = {
  devtool: IS_TEST ? undefined : 'source-map',
  entry: IS_TEST ? null : path.join(__dirname, 'framework/index.ts'),
  plugins: IS_TEST ? [
    // fixes sourcemaps / line number matching in tests
    // https://github.com/webpack-contrib/karma-webpack/issues/109#issuecomment-224961264
    // when using awesome-typescript-loader, do not enable inlineSourcemaps there nor in tsconfig
    new webpack.SourceMapDevToolPlugin({
      filename: null,          // if no value is provided the sourcemap is inlined
      test: /\.(ts|js)($|\?)/i // process .js and .ts files only
    })
  ] : [],
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
    }].concat(IS_COVERAGE ? [{
      test: /\.(js|ts)$/,
      enforce: 'post',
      loader: 'istanbul-instrumenter-loader',
      include: path.join(__dirname, 'framework'),
      exclude: [
        /tests.js/,
        /\.(e2e|test|spec)\.ts$/,
        /node_modules/
      ]
    }] : [])
  },
  cache: true,
  output: IS_TEST ? {} : {
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
