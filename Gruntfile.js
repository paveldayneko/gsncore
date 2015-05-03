module.exports = function (grunt) {
  var fs = require('fs');
  var extend = require('util')._extend;

  grunt.util.linefeed = '\n';

  //init configuration
  grunt.config.init({
    pkg: grunt.file.readJSON('package.json')
  });

  //clean
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.config('clean', {
    build: 'dist'
  });

  //js hint
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.config('jshint', {
    options: {},
    all: [
      'Gruntfile.js',
      'src/gsn.js', 'src/angulartics.gsn.ga.js', 'src/module.js', 'src/**/*.js'
    ]
  });

  var banner = '/*!\n<%= pkg.name %> - <%= pkg.version %>\n' +
              '<%= pkg.description %>\n' +
              'Build date: <%= grunt.template.today("yyyy-mm-dd hh-MM-ss") %> \n*/\n';

  //concat
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.config('concat', {
    build: {
      options: {
        banner: banner
      },
      src: ['src/gsn.js', 'src/angulartics.gsn.ga.js', 'src/module.js', 'src/angular-recaptcha.js', 'src/**/*.js', 'vendor/**.js'],
      dest: '<%= clean.build %>/<%= pkg.version %>/gsncore.js'
    },
    buildservice: {
      options: {
        banner: banner
      },
      src: ['src/gsn.js', 'src/angulartics.gsn.ga.js', 'src/module.js', 'src/angular-recaptcha.js', 'src/filters/*.js', 'src/directives/!(ctrlAccount|ctrlCouponClassic|ctrlCouponRoundy|ctrlEmployment|ctrlFreshPerksCardRegistration|ctrlHome|ctrlProLogicRegistration|ctrlProLogicRewardCard|ctrlRegistration|ctrlRoundyProfile|ctrlSilverEmployment).js', 'src/services/!(gsnAisle50|gsnProLogicRewardCard|gsnSdk).js', 'vendor/**.js'],
      dest: '<%= clean.build %>/<%= pkg.version %>/gsncore-service.js'
    }
  });
  
  //uglify
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.config('uglify', {
    options: {
      banner: banner
    },
    build: {
      src: ['<%= concat.build.dest %>'],
      dest: '<%= clean.build %>/<%= pkg.version %>/gsncore.min.js'
    },
    buildservice: {
      src: ['<%= concat.buildservice.dest %>'],
      dest: '<%= clean.build %>/<%= pkg.version %>/gsncore-service.min.js'
    }
  });

  //compress
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.config('compress', {
    build: {
      options: {
        archive: '<%= clean.build %>/gsncore-<%= pkg.version %>.zip'
      },
      expand: true,
      cwd: '<%= clean.build %>/<%= pkg.version %>',
      src: ['**'],
      dest: '<%= pkg.version %>'
    }
  });
  
  grunt.loadNpmTasks('grunt-karma');
  grunt.config('karma', {
    unit: {
      configFile: '../karma.unit.conf.js'
    },
    build: {    
      configFile: 'karma.conf.js'
    }
  });
  

  //metatasks
  grunt.registerTask('build', [
    'jshint',
    'clean',
    'concat',
    'uglify'
  ]);
  
  grunt.registerTask('buildservice', [
  'concat',
  'uglify'
  ]);
  
  grunt.registerTask('test', [
    'jshint',
    'clean',
    'karma:build'
  ]);
  
  grunt.registerTask('test-remote', [
  'jshint',
  'clean',
  'karma:unit'
  ]);
  
};
