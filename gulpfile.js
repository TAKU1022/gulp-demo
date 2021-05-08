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

const paths = { scss: './src/scss/**/*.scss' }; //パスの指定
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
    .pipe(dest('./src/css/', { sourcemaps: '.' }))
    .pipe(browserSync.stream()); //修正部分のみがwatchの際に反映
};

//watchタスクの登録
const watchFiles = () => {
  watch(paths.scss, (cb) => {
    compileSass();
    cb();
  });
  watch('./src/**/*.html', (cb) => {
    browserSync.reload();
    cb();
  });
};

const server = () => {
  browserSync.init({
    server: {
      baseDir: 'src',
      index: 'index.html',
    },
  });
};

const deleteDist = (cb) => {
  rimraf('./src/css', cb);
};
const build = parallel(deleteDist, parallel(compileSass));

//タスクの宣言
exports.css = compileSass();
exports.watchFiles = watchFiles();
exports.build = build;
exports.default = series(parallel(server, watchFiles));
