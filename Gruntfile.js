module.exports = function(grunt) {

  grunt.initConfig({
    /*jshint: {
      files: ['Gruntfile.js', 'src/!**!/!*.js', 'test/!**!/!*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },*/
    sass: {
      dist: {
        options: {
          style: 'expanded'
        },
        files: {
          'assets/css/main.css': 'assets/sass/main.sass'
        }
      }
    },
    watch: {
        css: {
            files: 'assets/sass/**/*.sass',
            tasks: ['sass']
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('default', ['watch']);

};
