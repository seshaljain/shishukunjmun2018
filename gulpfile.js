var {
  spawn
} = require("child_process");
var browserSync = require("browser-sync").create();
var gulp = require("gulp");
var concat = require("gulp-concat");
var flatten = require("gulp-flatten");
var sass = require("gulp-sass");
var del = require("del");
var sourcemaps = require("gulp-sourcemaps");
var autoprefixer = require("gulp-autoprefixer");
var hugoBin = require("hugo-bin");
var uglify = require("gulp-uglify");
var when = require("gulp-if");
var argv = require("yargs").argv;
// var gzip = require("gulp-gzip");
// var hash = require("gulp-hash");

// var browserSync = BrowserSync.create();

/*
// Build tasks
*/

var hugoArgs = ["-d", "../dist", "-s", "site"];

// gulp hugo --> run hugo-bin
gulp.task("hugo", (done) => {
  return hugo(done);
});

// separate function for hugo (no idea why)
function hugo(done, options) {
  return spawn(hugoBin, hugoArgs, { stdio: "inherit" }).on("close", function (code) {
    if (code === 0) {
      browserSync.reload();
      done();
    } else {
      browserSync.notify("Hugo build failed :(");
      done("Hugo build failed");
    }
  });
}

// gulp styles [--prod] --> build css files from scss
gulp.task("styles", () =>
  gulp.src("./src/scss/styles.scss")
  .pipe(when(!argv.prod, sourcemaps.init()))
  .pipe(sass().on("error", sass.logError))
  .pipe(autoprefixer({
    browsers: "last 5 versions"
  }))
  .pipe(when(!argv.prod, sourcemaps.write()))
  // .pipe(hash())
  .pipe(gulp.dest("./dist/assets/css"))
  // .pipe(hash.manifest("hash.json"))
  // .pipe(gulp.dest("./site/data/css"))
  .pipe(when(!argv.prod, browserSync.stream()))
);

// gulp scripts [--prod] --> concat and uglify js files
gulp.task("scripts", () =>
  gulp.src([
    "./node_modules/bootstrap.native/dist/bootstrap-native-v4.js",
    "./src/js/app.js"
  ])
  .pipe(concat("script.js"))
  .pipe(when(argv.prod, uglify()))
  .pipe(gulp.dest("./dist/assets/js/"))
);

// gulp clean --> clean dist/
gulp.task("clean", () => {
  return del(["dist/"]);
});

// No need for a separate fonts tasks -- hugo does it by itself
// gulp fonts --> copy flattened font directory to dist/
// gulp.task("fonts", () =>
//   gulp.src("./src/fonts/**/*")
//   .pipe(flatten())
//   .pipe(gulp.dest("./dist/assets/fonts"))
//   .pipe(browserSync.stream())
// );

/*
// Server tasks
*/

// properly reload the browser
function reload(done) {
  browserSync.reload();
  done();
};

// gulp serve --> launch BrowserSync server
gulp.task("serve", (done) => {
  browserSync.init({
    // ghostMode: {
    //  clicks: true,
    //  forms: true,
    //  scroll: false
    // },
    // tunnel: true,
    // open: "tunnel",
    // ghostMode: false,
    server: "./dist"
  });
  done();

  // watch files for changes
  gulp.watch(["./site/**/*.html", "./site/**/*.md", "./site/data/*"], gulp.series("hugo", reload));
  gulp.watch("./src/js/**/*.js", gulp.series("scripts", reload));
  gulp.watch("./src/scss/**/*.scss", gulp.series("styles"));
});

/*
// Main gulp tasks
*/

// gulp assets [--prod] --> run "styles" and "scripts"
gulp.task("assets", gulp.parallel("styles", "scripts"));

// gulp build --> clean and build dist/
gulp.task("build", gulp.series("clean", "assets", "hugo"));

// gulp [--prod] --> run "build" and "serve" in series
gulp.task("default", gulp.series("build", "serve"));
