var gulp =       require('gulp');
var gutil =      require('gulp-util');
var uglify =     require('gulp-uglify');
var jshint =     require('gulp-jshint');
var webpack =    require('gulp-webpack');
var rename =     require('gulp-rename');
var coffee =     require('gulp-coffee');
var concat =     require('gulp-concat');
var header =     require('gulp-header');
var git =        require('gulp-git');
var runSeq =     require('run-sequence');
var inject =     require('gulp-inject');

var del =        require('del');
var fs =         require('fs');
var bump =       require('gulp-bump');
var exec =       require('child_process').exec;
                 require('gulp-grunt')(gulp);

var pkg = require('./package.json');
var banner = [
  '/*!',
  ' * <%= pkg.name %>',
  ' * version <%= pkg.version %>',
  ' * <%= pkg.description %>',
  ' * Build date: <%= new Date() %>',
  ' */\n'
].join('\n');
var allSources = ['src/gsn.js', 'src/angulartics.gsn.ga.js', 'src/module.js', 'src/angular-recaptcha.js', 'vendor/**.js', 'src/**/*.js'];

gulp.task('bump', function(){
    return gulp.src(['./package.json', './bower.json', './component.json'])
        .pipe(bump({type: 'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('clean', function(cb) {
  del(['dist'], cb);
});

gulp.task('build', function() {
  return gulp.src(allSources)
    .pipe(concat('gsncore.js'))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean', 'build'], function() {
  return gulp.src('./dist/*.js')
    .pipe(uglify())
    .pipe(header(banner, {pkg: pkg}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist'));
});

/*** 
 * ideally, these would be unit tests
 * but they are here for debugging (bad)
 */
gulp.task('index.html', function(){
  var target = gulp.src('./example/index.html');
  var sources = gulp.src(allSources);

  return target.pipe(inject(sources))
    .pipe(gulp.dest('./example'));
});


gulp.task('home.html', function(){
  var target = gulp.src('./example/home.html');
  var sources = gulp.src(['src/gsn.js', 
    'src/angulartics.gsn.ga.js', 
    'src/module.js', 
    'src/services/*.js', 
    'src/filters/*.js', 
    'vendor/angular-facebook.js',
    'vendor/angulartics.min.js',
    'vendor/fastclick.js',
    'vendor/flowplayer*.js',
    'vendor/jquery.di*.js',
    'vendor/loading-bar.min.js',
    'vendor/respond.min.js',
    'vendor/respond.*.*.js',
    'directives/facebook.js',
    'directives/gsn*.js',
    'directives/placeholder.js'
  ]);

  return target.pipe(inject(sources))
    .pipe(gulp.dest('./example'));
});