// src : 指定されたファイルを読み込む
// dest : 指定されたディレクトリに書き出す
// parallel : 指定されたタスクを並列処理（同時に実行）する
// series : 指定されたタスクを直列処理（順番に実行）する
// watch : 指定されたファイルを監視する
const { src, dest, parallel, series, watch } = require('gulp');

const sass = require('gulp-dart-sass'); //Dart SassでSCSSファイルのCSSへのコンパイルを実行
const postcss = require('gulp-postcss'); //PostCSSで生成されたCSSファイルを加工
const autoprefixer = require('autoprefixer'); //CSSにベンダープレフィックスを自動で付与
const flexBugsFixes = require('postcss-flexbugs-fixes'); //Flexbox関連のブラウザ間の挙動差異を自動回避
const declarationSorter = require('css-declaration-sorter'); //CSSのプロパティの並びを自動修正
const cssWring = require('csswring'); //CSSの圧縮
const rimraf = require('gulp-rimraf'); //ファイル削除
const browserSync = require('browser-sync').create(); //localhostサーバーを立ち上げ
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config');

//パスの指定
const paths = {
  html: './src/**/*.html',
  scss: './src/scss/**/*.scss',
  js: './src/js/**/*.js',
};

//htmlタスクの登録
const copyHtml = () => {
  return src(paths.html).pipe(dest('./dist')).pipe(browserSync.stream());
};

//cssタスクの登録
const compileSass = () => {
  return src(paths.scss, { sourcemaps: true })
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(
      postcss([
        flexBugsFixes,
        autoprefixer({ grid: true }),
        declarationSorter({ order: 'smacss' }),
        cssWring,
      ])
    )
    .pipe(dest('./dist/css/', { sourcemaps: '.' }))
    .pipe(browserSync.stream()); //修正部分のみがwatchの際に反映
};

// jsタスクの登録
const transpileJs = () => {
  return webpackStream(webpackConfig, webpack).pipe(dest('./dist/js/'));
};

//watchタスクの登録
const watchFiles = () => {
  watch(paths.html, (cb) => {
    copyHtml();
    cb();
  });
  watch(paths.scss, (cb) => {
    compileSass();
    cb();
  });
  watch(paths.js, (cb) => {
    transpileJs();
    cb();
  });
  watch('./src/**/*.html', (cb) => {
    browserSync.reload();
    cb();
  });
};

const server = () => {
  browserSync.init({
    server: './dist',
  });
};

const build = parallel(copyHtml, compileSass, transpileJs);

//タスクの宣言
exports.html = copyHtml();
exports.css = compileSass();
exports.js = transpileJs();
exports.watchFiles = watchFiles();
exports.build = build;
exports.default = series(parallel(server, watchFiles));
