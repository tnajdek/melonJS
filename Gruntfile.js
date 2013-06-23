/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	
    concat: {
		basic: {
			src: [
				'src/core.js',
				'src/math/geometry.js',
				'src/debug/debug.js',
				'src/renderable/base.js',
				'src/renderable/sprite.js',
				'src/renderable/texturepacker.js',
				'src/renderable/camera.js',
				'src/entity/entity.js',
				'src/state/state.js',
				'src/loader/loader.js',
				'src/font/font.js',
				'src/GUI/GUI.js',
				'src/GUI/HUD.js',
				'src/audio/audio.js',
				'src/video/video.js',
				'src/input/input.js',
				'src/utils/utils.js',
				'src/utils/stat.js',
				'src/level/TMXConstants.js',
				'src/level/TMXUtils.js',
				'src/level/TMXObjectGroup.js',	
				'src/level/TMXTileset.js',
				'src/level/TMXRenderer.js',
				'src/level/TMXLayer.js',
				'src/level/TMXTiledMap.js',
				'src/level/TMXMapReader.js',
				'src/level/LevelDirector.js',
				'src/vendors/tween.js',
				'src/vendors/minpubsub.src.js',
				'src/plugin/plugin.js'
			],
			dest: 'build/<%= pkg.name %>-<%= pkg.version %>.js'
		},
		amd: {
			src: [
				'src/core-amd.js',
				'src/math/geometry.js',
				'src/debug/debug.js',
				'src/renderable/base.js',
				'src/renderable/sprite.js',
				'src/renderable/texturepacker.js',
				'src/renderable/camera.js',
				'src/entity/entity.js',
				'src/state/state.js',
				'src/loader/loader.js',
				'src/font/font.js',
				'src/GUI/GUI.js',
				'src/GUI/HUD.js',
				'src/audio/audio.js',
				'src/video/video.js',
				'src/input/input.js',
				'src/utils/utils.js',
				'src/utils/stat.js',
				'src/level/TMXConstants.js',
				'src/level/TMXUtils.js',
				'src/level/TMXObjectGroup.js',	
				'src/level/TMXTileset.js',
				'src/level/TMXRenderer.js',
				'src/level/TMXLayer.js',
				'src/level/TMXTiledMap.js',
				'src/level/TMXMapReader.js',
				'src/level/LevelDirector.js',
				'src/vendors/tween.js',
				'src/vendors/minpubsub.src.js',
				'src/plugin/plugin.js',
				'src/init.js',
			],
			options: {
				banner: 'define(function() {',
				footer: 'return me; });'
			},
			dest: 'build/<%= pkg.name %>-<%= pkg.version %>-amd.js'
		}
    },
	
	replace: {
		dist: {
			options: {
				variables: {
					'VERSION': '<%= pkg.version %>'
				},
				prefix: '@'
			},
			files: [
				{expand: true, flatten: true, src: ['build/<%= pkg.name %>-<%= pkg.version %>.js'], dest: 'build/'}
			]
		}
	},
	
	uglify: {
		options: {
			report: 'min',
			preserveComments: 'some'
		},
		basic: {
			files: {
				'build/<%= pkg.name %>-<%= pkg.version %>-min.js': ['<%= concat.basic.dest %>']
			}
		},
		amd: {
			files: {
				'build/<%= pkg.name %>-<%= pkg.version %>-amd-min.js': ['<%= concat.amd.dest %>']
			}
		}
	},
    
	
    jshint: {
		dist: {
			src: [ 'build/<%= pkg.name %>-<%= pkg.version %>.js' ]
		},
		options: {
			curly: true,
			eqeqeq: true,
			immed: true,
			latedef: true,
			newcap: false,
			noarg: true,
			sub: true,
			undef: true,
			boss: true,
			eqnull: true,
			browser: true,
			strict: false
		}
	},
	
	clean: {
		dist: ['build/<%= pkg.name %>-<%= pkg.version %>.js', 'build/<%= pkg.name %>-<%= pkg.version %>.min.js'],
		jsdoc: ['./docs/**/*.*', './docs/scripts', './docs/styles', './docs/images']
    },
   
    jsdoc : {
        dist : {
            src: ['build/<%= pkg.name %>-<%= pkg.version %>.js', 'README.md'],
            options: {
				configure: 'jsdoc_conf.json',
				destination: 'docs',
				template: 'tasks/jsdoc-template/melonjs'
            }
        }
    }
   
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-replace');
  
  // Custom Tasks
  grunt.loadTasks( 'tasks' );
  
 
  // Default task.
  grunt.registerTask('default', ['concat:basic', 'replace', 'uglify:basic']);
  grunt.registerTask('amd', ['concat:amd', 'replace', 'uglify:amd']);
  grunt.registerTask('lint', ['concat:basic', 'replace', 'jshint']);
  grunt.registerTask('doc', ['concat:basic', 'replace', 'jsdoc']);

};
