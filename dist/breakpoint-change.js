/*! breakpoint-change.js v1.1.1 | https://github.com/cbodin/breakpoint-change.js#readme */
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.BreakpointChange = factory();
  }
}(this, function() {
'use strict';

/**
 * A JavaScript library for receiving callbacks when stylesheet-defined breakpoints change.
 *
 * @param {Window} window
 * @param {String} [selectorBase=.breakpoint]
 * @class
 */
function BreakpointChange(window, selectorBase) {
  // We need to escape the selector for use in the regexp.
  var base = selectorBase || '.breakpoint';
  var escapedBase = base.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

  // Store arguments
  this.window = window;
  this.document = window.document;
  this.selectorRegex = new RegExp('^' + escapedBase + ' (#|\.)([a-z0-9-_]+)$', 'i');

  // Bind listeners
  this.onMediaChangeListener = this.matchMedia.bind(this);
  this.onInitTriggerListener = this.init.bind(this);

  // Properties
  this.addedReadyListener = false;
  this.addedLoadListener = false;
  this.callbacks = [];
  this.enterCallbacks = {};
  this.leaveCallbacks = {};
  this.breakpoints = [];
  this.defaultBreakpoint = undefined;
  this.currentBreakpoint = undefined;
}

/**
 * Add a callback for a breakpoint change.
 *
 * @public
 * @param {Function} callback
 */
BreakpointChange.prototype.on = function (callback) {
  this.objectKeyArrayAdd(this, 'callbacks', callback);
};

/**
 * Add a callback for when entering a specific breakpoint.
 *
 * @public
 * @param {String} name
 * @param {Function} callback
 */
BreakpointChange.prototype.onEnter = function (name, callback) {
  this.objectKeyArrayAdd(this.enterCallbacks, name, callback);
};

/**
 * Add a callback for when leaving a specific breakpoint.
 *
 * @public
 * @param {String} name
 * @param {Function} callback
 */
BreakpointChange.prototype.onLeave = function (name, callback) {
  this.objectKeyArrayAdd(this.leaveCallbacks, name, callback);
};

/**
 * Remove a previously added callback.
 *
 * @public
 * @param {Function} callback
 */
BreakpointChange.prototype.off = function (callback) {
  this.objectKeyArrayRemove(this, 'callbacks', callback);
};

/**
 * Remove a previously added enter callback.
 *
 * @public
 * @param {String} name
 * @param {Function} callback
 */
BreakpointChange.prototype.offEnter = function (name, callback) {
  this.objectKeyArrayRemove(this.enterCallbacks, name, callback);
};

/**
 * Remove a previously added leave callback.
 *
 * @public
 * @param {String} name
 * @param {Function} callback
 */
BreakpointChange.prototype.offLeave = function (name, callback) {
  this.objectKeyArrayRemove(this.leaveCallbacks, name, callback);
};

/**
 * Looks for the breakpoint selector in all stylesheets of the document. Defers
 * the initialization until the document or window is loaded to ensure stylesheets
 * are loaded.
 *
 * If the stylesheet containing the breakpoints are dynamically inserted, wait
 * until they're loaded before calling this method.
 *
 * @public
 */
BreakpointChange.prototype.init = function () {
  // Try and find breakpoints directly.
  if (this.setup()) {
    return;
  }

  var state = this.document.readyState;

  // If the document is still loading, wait for it to load.
  if (state === 'loading' && !this.addedReadyListener) {
    this.document.addEventListener('DOMContentLoaded', this.onInitTriggerListener);
    this.addedReadyListener = true;
  }

  // The document is loaded, wait for the window to load.
  else if (state === 'interactive' && !this.addedLoadListener) {
    this.window.addEventListener('load', this.onInitTriggerListener);
    this.addedLoadListener = true;
  }
};

/**
 * Returns the identifier for the current breakpoint.
 *
 * @public
 * @return {String}
 */
BreakpointChange.prototype.getBreakpoint = function () {
  return this.currentBreakpoint;
};

/**
 * Called when the document is ready/loaded and sets up listeners
 * on all media query lists.
 *
 * @private
 * @return {Boolean} True if breakpoints were found, false if not.
 */
BreakpointChange.prototype.setup = function () {
  // Abort if we already found our breakpoints
  if (this.breakpoints.length > 0) {
    return true;
  }

  var breakpoints = this.getBreakpoints();

  if (breakpoints.length > 0) {
    // Store breakpoints
    this.breakpoints = breakpoints;

    // Add listeners
    this.breakpoints.forEach(function (breakpoint) {
      if (breakpoint.isDefault) {
        this.defaultBreakpoint = breakpoint.name;
      }

      breakpoint.mql.addListener(this.onMediaChangeListener);
    }, this);

    // Check what breakpoint we're currently on
    this.matchMedia();

    return true;
  }

  return false;
};

/**
 * Searches the stylesheets for breakpoints and returns all matches.
 *
 * @private
 * @return {Array}
 */
BreakpointChange.prototype.getBreakpoints = function (stylesheets) {
  var sheets = stylesheets || this.document.styleSheets;
  var breakpoints = [];

  for (var i = 0; i < sheets.length; i++) {
    try {
      var rules = sheets[i].cssRules || [];

      // Find all media queries
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];

        if (rule.type === 3) {
          breakpoints = breakpoints.concat(this.getBreakpoints([rule.styleSheet]));
        } else if (rule.type === 4) {
          var breakpoint = this.findBreakpoint(rule.cssRules);

          if (breakpoint) {
            // Match the media
            var mql = this.window.matchMedia(rule.media.mediaText);

            breakpoints.push({
              name: breakpoint.name,
              mql: mql,
              isDefault: breakpoint.isDefault
            });
          }
        }
      }
    } catch (error) {
      // Catches security errors in firefox when trying to read stylesheets loaded from another domain.
    }
  }

  return breakpoints;
};

/**
 * Searches through all rules in the list and returns an object containing
 * the name and a flag indicating if this is the default breakpoint.
 *
 * @private
 * @param {Array} cssRules
 * @return {Object|undefined}
 */
BreakpointChange.prototype.findBreakpoint = function (cssRules) {
  var match;
  var rules = cssRules || [];

  for (var i = 0; i < rules.length; i++) {
    // This is a style rule and not a media rule
    if (rules[i].type === 1) {
      var matches = rules[i].selectorText.match(this.selectorRegex);
      if (matches) {
        match = {
          isDefault: matches[1] === '#',
          name: matches[2]
        };
      }
    }
  }

  return match;
};

/**
 * Checks what the current breakpoint is. If there is a change all callbacks will
 * get notified.
 *
 * @private
 */
BreakpointChange.prototype.matchMedia = function () {
  var currentBreakpoint = this.currentBreakpoint || this.defaultBreakpoint;

  var match;

  this.breakpoints.forEach(function (bp) {
    if (bp.mql.matches) {
      match = bp;
    }
  });

  if (match) {
    this.currentBreakpoint = match.name;
  }

  if (match && match.name !== currentBreakpoint) {
    if (Object.prototype.hasOwnProperty.call(this.leaveCallbacks, currentBreakpoint)) {
      this.leaveCallbacks[currentBreakpoint].forEach(function (callback) {
        callback(currentBreakpoint);
      });
    }

    this.callbacks.forEach(function (callback) {
      callback(match.name, currentBreakpoint);
    });

    if (Object.prototype.hasOwnProperty.call(this.enterCallbacks, match.name)) {
      this.enterCallbacks[match.name].forEach(function (callback) {
        callback(match.name);
      });
    }
  }
};

/**
 * Add an item to an array that might not exist on an objects property.
 * Creates a new array if the property does not exist.
 *
 * @private
 * @param {Object} object
 * @param {String} key
 * @param {*} item
 */
BreakpointChange.prototype.objectKeyArrayAdd = function (object, key, item) {
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    object[key] = [];
  }

  var index = object[key].indexOf(item);
  if (index === -1) {
    object[key].push(item);
  }
};

/**
 * Remove an item from an objects property if it's an array.
 *
 * @private
 * @param {Object} object
 * @param {String} key
 * @param {*} item
 */
BreakpointChange.prototype.objectKeyArrayRemove = function (object, key, item) {
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    return;
  }

  var index = object[key].indexOf(item);
  if (index !== -1) {
    object[key].splice(index, 1);
  }
};

return BreakpointChange;
}));
