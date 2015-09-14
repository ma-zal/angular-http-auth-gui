module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		ngtemplates:  {
		  'http-auth-gui-interceptor': {
				cwd:      'src',
				src:      '*.html',
				dest:     '.tmp/templates.js',
				options:    {
					prefix: 'bower_components/angular-http-auth-gui/src/',
					htmlmin:  {
						collapseWhitespace: true,
						collapseBooleanAttributes: true,
						removeComments: true
					}
				}
			}
		},
		concat: {
			options: {
			  separator: ' ' /* Note: ';' is safe, if some missing in end of some file */
			},
			dist: {
			  src: [
				'src/module-init.js',
				'src/backend-auth-service.js',
				'src/login-dialog-ctrl.js',
				'src/popup-login-dialog.js',
				'.tmp/templates.js'
				],
			  dest: 'dist/http-auth-gui-interceptor.js'
			}
		  },
		  clean: {
			tmp: ['.tmp']
		},
		ngAnnotate: {
			options: {
				// Task-specific options go here.
			},
			dist: {
				files: {
					'.tmp/http-auth-gui-interceptor.anotated.js': ['dist/http-auth-gui-interceptor.js']
				}
			}
		},
		uglify: {
			options: {
//				mangle: false,
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> */ '
			},
			dist: {
			  files: {
				'dist/http-auth-gui-interceptor.min.js': ['.tmp/http-auth-gui-interceptor.anotated.js']
			  }
			}
		}
	});

	//Load NPM tasks
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-ng-annotate');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
	//Default task(s).
	grunt.registerTask('build', ['ngtemplates', 'concat', 'ngAnnotate','uglify', 'clean:tmp']);

};