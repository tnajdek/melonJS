/*
 * MelonJS Game Engine
 * Copyright (C) 2011 - 2013, Olivier BIOT, Jason Oster
 * http://www.melonjs.org
 *
 */


/**
 * A singleton for managing collision detection.
 * @final
 * @memberOf me
 * @constructor Should not be called by the user.
 */
me.collision = (function() {

    // Hold public stuff inside the singleton
    var api = {};

    // Collision types
    api.types = {
        NO_OBJECT : 0,

        /**
         * Default object type constant.<br>
         * See type property of the returned collision vector.
         * @constant
         * @name me.collision.types#ENEMY_OBJECT
         */
        ENEMY_OBJECT : 1,

        /**
         * Default object type constant.<br>
         * See type property of the returned collision vector.
         * @constant
         * @name me.collision.types#COLLECTABLE_OBJECT
         */
        COLLECTABLE_OBJECT : 2,

        /**
         * Default object type constant.<br>
         * See type property of the returned collision vector.
         * @constant
         * @name me.collision.types#ACTION_OBJECT
         */
        ACTION_OBJECT : 3 // door, etc...
    };

    // Spacial grid
    var grid = null;
    var objectCount = 0;

    /**
     * Width of a cell in the collision spacial grid<br>
     * @public
     * @type {Number}
     * @name me.collision#gridwidth
     */
    (Object.defineProperty(api, "gridwidth", {
        get : function() {
            var layer = me.game.collisionMap;
            return (
                me.game.currentLevel.gridwidth ||
                me.sys.collisionGridWidth ||
                (layer && (layer.tilewidth * 4)) ||
                128
            );
        }
    }));

    /**
     * Height of a cell in the collision spacial grid<br>
     * @public
     * @type {Number}
     * @name me.collision#gridheight
     */
    (Object.defineProperty(api, "gridheight", {
        get : function() {
            var layer = me.game.collisionMap;
            return (
                me.game.currentLevel.gridheight ||
                me.sys.collisionGridHeight ||
                (layer && (layer.tileheight * 4)) ||
                128
            );
        }
    }));

    /**
     * Width of collision spacial grid<br>
     * @public
     * @type {Number}
     * @name me.collision#cols
     */
    (Object.defineProperty(api, "cols", {
        get : function() {
            var layer = me.game.collisionMap || me.game.currentLevel;
            return Math.ceil(layer.width / api.gridwidth);
        }
    }));

    /**
     * Height of collision spacial grid<br>
     * @public
     * @type {Number}
     * @name me.collision#rows
     */
    (Object.defineProperty(api, "rows", {
        get : function() {
            var layer = me.game.collisionMap || me.game.currentLevel;
            return Math.ceil(layer.height / api.gridheight);
        }
    }));

    /**
     * Reset the spacial grid.<br>
     * @name me.collision#reset
     * @protected
     * @function
     */
    api.reset = function () {
        objectCount = 0;

        var cols = api.cols;
        var rows = api.rows;
        var gridwidth = api.gridwidth;
        var gridheight = api.gridheight;

        // Create new empty grid
        grid = [];
        for (var x = 0; x < cols; x++) {
            grid[x] = [];
            for (var y = 0; y < rows; y++) {
                grid[x][y] = new me.Rect(
                    new me.Vector2d(x * gridwidth, y * gridheight),
                    gridwidth,
                    gridheight
                );
                grid[x][y].objects = [];
            }
        }
    };

    /**
     * Populate the spacial grid after a level has loaded.<br>
     * @name me.collision#onLevelLoaded
     * @private
     * @function
     */
    api.onLevelLoaded = function () {
        var layer = me.game.collisionMap;
        if (!layer)
            return;

        var gridwidth = api.gridwidth;
        var gridheight = api.gridheight;

        // Populate grid with me.Tile objects
        for (var sx = 0; sx < layer.cols; sx++) {
            var dx = ~~((sx * layer.tilewidth) / gridwidth);

            for (var sy = 0; sy < layer.rows; sy++) {
                var dy = ~~((sy * layer.tileheight) / gridheight);

                var tile = layer.layerData[sx][sy];
                if (!tile)
                    continue;

                var tileset = layer.tilesets.getTilesetByGid(
                    tile.tileId
                );
                var props = tileset.getTileProperties(tile.tileId);

                if (props.isCollidable) {
                    // Set collision mask for tile
                    tile.collisionMask = (
                        typeof(props.collisionmask) !== "undefined" ?
                        props.collisionmask : 0xFFFFFFFF
                    );

                    api.add(tile, dx, dy);
                }
            }
        }
    };

    /**
     * Add an object to the spacial grid.<br>
     * @name me.collision#add
     * @public
     * @function
     * @param {me.ObjectEntity} obj Object to be added
     * @param {Number} x Grid position X
     * @param {Number} y Grid position Y
     */
    api.add = function (obj /** x,y | cell */) {
        objectCount++;

        // Evaluate args
        var cell = arguments[1];
        if (!Object.isObject(cell)) {
            cell = grid[cell][arguments[2]];
        }

        // Add doubly-linked list
        obj._collisionCells.push(cell);
        cell.objects.push(obj);
    };

    /**
     * Remove an object from the spacial grid.<br>
     * @name me.collision#remove
     * @public
     * @function
     * @param {me.ObjectEntity} obj Object to be removed
     * @param {Number} x Grid position X
     * @param {Number} y Grid position Y
     */
    api.remove = function (obj /** x,y | cell */) {
        objectCount--;

        // Evaluate args
        var cell = arguments[1];
        if (!Object.isObject(cell))
            cell = grid[cell][arguments[2]];

        // Remove doubly-linked list
        obj._collisionCells.remove(cell);
        cell.objects.remove(obj);
    };

    /**
     * Update an object's position within the spacial grid.<br>
     * @name me.collision#updateMovement
     * @public
     * @function
     * @param {me.ObjectEntity} obj Object to be updated
     */
    api.updateMovement = function (obj) {
        // TODO: Determine if keeping the object list in a hash is faster than
        // using an array.
        // Because this will allow us to remove only the cells we know do not
        // intersect with obj._collisionRange, and unconditionally add every
        // object (without duplication)

        /* Broad phase */

        // Update collision range of motion
        obj._collisionRange = obj.collisionBox.getRect().addV(obj.vel);
        obj._collisionRange.pos.add(obj.collisionBox.colPos);

        // Remove from cells
        obj._collisionCells.slice(0).forEach(function (cell) {
            api.remove(obj, cell);
        });

        var gridwidth = api.gridwidth;
        var gridheight = api.gridheight;

        var start = new me.Vector2d(
            Math.max(obj._collisionRange.left / gridwidth, 0),
            Math.max(obj._collisionRange.top / gridheight, 0)
        ).floorSelf();

        var end = new me.Vector2d(
            Math.min(obj._collisionRange.right / gridwidth, api.cols),
            Math.min(obj._collisionRange.bottom / gridheight, api.rows)
        ).ceilSelf();

        // Add to cells
        for (var x = start.x; x < end.x; x++) {
            for (var y = start.y; y < end.y; y++) {
                api.add(obj, x, y);
            }
        }
    };

    /**
     * Returns the amount of object considered for collision per frame<br>
     * @name me.collision#getObjectCount
     * @protected
     * @function
     * @return {Number} the amount of objects in the collision spacial grid
     */
    api.getObjectCount = function() {
        return objectCount;
    };

    /**
     * Perform collision detection for a given object.<br>
     * @name me.collision#check
     * @private
     * @function
     * @param {me.ObjectEntity} objA Object to be tested for collisions
     * @return {Object[]} Array of {me.ObjectEntity} or {me.Tile} that *may* collide
     */
    api.check = function (objA) {

        /* Narrow phase */
        var result = [];

        // Iterate each collision cell
        objA._collisionCells.forEach(function (cell) {
            // Iterate each object in the cell
            cell.objects.forEach(function (objB) {

                // Skip this object and previously handled objects
                if (objA === objB || result.indexOf(objB) >= 0 ||
                    // And masked objects
                    objA.collisionMask & objB.collisionMask === 0 ||
                    // And objects that fail the AABB test
                    !objA._collisionRange.overlaps(objB._collisionRange)) {

                    return;
                }

                if (typeof(objB._collisionWith) !== "undefined") {
                    // objB is a me.ObjectEntity

                    // Record collision
                    result.push(objB);
                    objB._collisionWith.push(objA);

                    // FIXME
                    objA.onCollision(null, objB);
                    objB.onCollision(null, objA);
                }
                else {
                    // objB is a me.Tile

                    // Record collision
                    result.push(objB);

                    // FIXME
                    objA.onCollision(null, objB);
                }
            });
        });

        return result;
    };

    /**
     * Draw collision detection spacial grid (for debugging).<br>
     * @name me.collision#draw
     * @protected
     * @function
     * @param {Context2d} context Destination canvas context
     */
    api.draw = function (context) {
        var gridwidth = api.gridwidth;
        var gridheight = api.gridheight;

        // Setup context
        context.fillStyle = "red";

        var start = new me.Vector2d(
            Math.max(me.game.viewport.left / gridwidth, 0),
            Math.max(me.game.viewport.top / gridheight, 0)
        ).floorSelf();

        var end = new me.Vector2d(
            Math.min(me.game.viewport.right / gridwidth, api.cols),
            Math.min(me.game.viewport.bottom / gridheight, api.rows)
        ).ceilSelf();

        for (var x = start.x, dx = x * gridwidth; x < end.x; x++) {
            for (var y = start.y, dy = y * gridheight; y < end.y; y++) {
                // Opacity is based on number of objects in the cell
                context.globalAlpha = (grid[x][y].objects.length / 16).clamp(0, 1);

                context.fillRect(dx, dy, gridwidth, gridheight);
                dy += gridwidth;
            }
            dx += gridheight;
        }

        // Reset context
        context.globalAlpha = 1;
    };

    // Return public API
    return api;
})();

// Reset the collision detection engine when a new level is loaded
me.event.subscribe(me.event.LEVEL_LOADED, me.collision.onLevelLoaded);
