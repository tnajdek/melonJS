function _init_ME($) {
	// don't do anything if already initialized (should not happen anyway)
	if (me_initialized) {
		return;
	}

	// enable/disable the cache
	me.utils.setNocache(document.location.href.match(/\?nocache/)||false);

	// detect audio capabilities
	me.audio.detectCapabilities();
	
	// detect touch capabilities
	me.sys.touch = ('createTouch' in document) || ('ontouchstart' in $) || (navigator.isCocoonJS);
	
	// detect platform
	me.sys.isMobile = me.sys.ua.match(/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i);

	// init the FPS counter if needed
	me.timer.init();

	// create a new map reader instance
	me.mapReader = new me.TMXMapReader();

	// create a default loading screen
	me.loadingScreen = new me.DefaultLoadingScreen();

	// init the App Manager
	me.state.init();

	// init the Entity Pool
	me.entityPool.init();

	// init the level Director
	me.levelDirector.reset();

	me_initialized = true;
}

_init_ME(window);
