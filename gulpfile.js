var gulp =       require('gulp');
var gutil =      require('gulp-util');
var uglify =     require('gulp-uglify');
var jshint =     require('gulp-jshint');;
var rename =     require('gulp-rename');
var concat =     require('gulp-concat');
var header =     require('gulp-header');
var git =        require('gulp-git');
var runSeq =     require('run-sequence');
var inject =     require('gulp-inject');
var fs =         require('fs');
var bump =       require('gulp-bump');
var exec =       require('child_process').exec;

var pkg = require('./package.json');
var banner = [
  '/*!',
  ' * <%= pkg.name %>',
  ' * version <%= pkg.version %>',
  ' * <%= pkg.description %>',
  ' * Build date: <%= new Date() %>',
  ' */\n'
].join('\n');
var allSources = ['src/gsn.js', 'src/module.js', 'src/gsn-ui-map.js', 'src/angular-recaptcha.js', 'vendor/**.js', 'src/**/*.js'];

gulp.task('bump', function(){
    return gulp.src(['./package.json'])
        .pipe(bump({type: 'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('build', function() {
  return gulp.src(allSources)
    .pipe(concat('gsncore.js'))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('.'));
});


gulp.task('build-basic', function() {
  return gulp.src(['src/gsn.js', 'src/module.js', 'src/gsn-ui-map.js', 'src/bindonce.js', 'src/angular-recaptcha.js', 'src/filters/*.js', 'src/services/!(gsnProLogicRewardCard).js'
    , 'src/directives/ctrlAccount.js'
    , 'src/directives/ctrlChangePassword.js'
    , 'src/directives/ctrlContactUs.js'
    , 'src/directives/ctrlLogin.js'
    , 'src/directives/ctrlShoppingList.js'
    , 'src/directives/facebook.js'
    , 'src/directives/gsn*.js'
    , 'src/directives/ngGiveHead.js'
    , 'src/directives/placeholder.js'
    , 'vendor/angular-facebook.js'
    , 'vendor/angulartics.min.js'
    , 'vendor/fastclick.js'
    , 'vendor/loading-bar.min.js'
    , 'vendor/ng-infinite-scroll.min.js'
    , 'vendor/ui-utils.min.js'
    ])
    .pipe(concat('gsncore-basic.js'))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('.'));
});


gulp.task('default', ['build', 'build-basic'], function() {
  gulp.src('./gsncore-basic.js')
    .pipe(uglify())
    .pipe(header(banner, {pkg: pkg}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('.'));

  return gulp.src('./gsncore.js')
    .pipe(uglify())
    .pipe(header(banner, {pkg: pkg}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('.'));
});