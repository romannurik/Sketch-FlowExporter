var that = this;
function __skpm_run (key, context) {
  that.context = context;

var exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/command-export-options.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/mocha-js-delegate/index.js":
/*!*************************************************!*\
  !*** ./node_modules/mocha-js-delegate/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* globals NSUUID MOClassDescription NSObject NSSelectorFromString NSClassFromString */

module.exports = function (selectorHandlerDict, superclass) {
  var uniqueClassName = 'MochaJSDelegate_DynamicClass_' + NSUUID.UUID().UUIDString()

  var delegateClassDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, superclass || NSObject)

  delegateClassDesc.registerClass()

  // Storage Handlers
  var handlers = {}

  // Define interface
  this.setHandlerForSelector = function (selectorString, func) {
    var handlerHasBeenSet = (selectorString in handlers)
    var selector = NSSelectorFromString(selectorString)

    handlers[selectorString] = func

    /*
      For some reason, Mocha acts weird about arguments: https://github.com/logancollins/Mocha/issues/28
      We have to basically create a dynamic handler with a likewise dynamic number of predefined arguments.
    */
    if (!handlerHasBeenSet) {
      var args = []
      var regex = /:/g
      while (regex.exec(selectorString)) {
        args.push('arg' + args.length)
      }

      var dynamicFunction = eval('(function (' + args.join(', ') + ') { return handlers[selectorString].apply(this, arguments); })')

      delegateClassDesc.addInstanceMethodWithSelector_function_(selector, dynamicFunction)
    }
  }

  this.removeHandlerForSelector = function (selectorString) {
    delete handlers[selectorString]
  }

  this.getHandlerForSelector = function (selectorString) {
    return handlers[selectorString]
  }

  this.getAllHandlers = function () {
    return handlers
  }

  this.getClass = function () {
    return NSClassFromString(uniqueClassName)
  }

  this.getClassInstance = function () {
    return NSClassFromString(uniqueClassName).new()
  }

  // Convenience
  if (typeof selectorHandlerDict === 'object') {
    for (var selectorString in selectorHandlerDict) {
      this.setHandlerForSelector(selectorString, selectorHandlerDict[selectorString])
    }
  }
}


/***/ }),

/***/ "./node_modules/sketch-nibui/index.js":
/*!********************************************!*\
  !*** ./node_modules/sketch-nibui/index.js ***!
  \********************************************/
/*! exports provided: load */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "load", function() { return load; });
/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function load(context, nibName) {
  return new NibUI(context, nibName);
}

class NibUI {
  constructor(context, nibName) {
    let bundle = NSBundle.bundleWithURL(context.plugin.url());

    // register a class that doesn't exist yet. note that we can't reuse the same
    // definition lest Sketch will throw an MOJavaScriptException when binding the UI,
    // probably due to JavaScript context / plugin lifecycle incompatibility

    let tempClassName;
    while (true) {
      tempClassName = 'NibOwner' + randomId();
      if (NSClassFromString(tempClassName) == null) {
        break;
      }
    }

    this.cls_ = MOClassDescription.allocateDescriptionForClassWithName_superclass_(
        tempClassName, NSClassFromString('NSObject'));
    this.cls_.registerClass();
    this.nibOwner_ = NSClassFromString(tempClassName).alloc().init();

    let tloPointer = MOPointer.alloc().initWithValue(null);

    if (bundle.loadNibNamed_owner_topLevelObjects_(nibName, this.nibOwner_, tloPointer)) {
      let topLevelObjects = tloPointer.value();
      for (var i = 0; i < topLevelObjects.count(); i++) {
        let obj = topLevelObjects.objectAtIndex(i);
        if (obj.className().endsWith('View')) {
          this.rootView = obj;
          break;
        }
      }
    } else {
      throw new Error(`Error loading nib file ${nibName}.nib`);
    }

    // populate view IDs
    this.views = {};
    walkViewTree(this.rootView, view => {
      let id = String(view.identifier());
      if (id && !id.startsWith('_')) {
        this.views[id] = view;
      }
    });
  }
}

/**
 * Depth-first traversal for NSViews.
 */
function walkViewTree(rootView, fn) {
  let visit_ = view => {
    fn(view);

    let nsArray = view.subviews();
    let count = nsArray.count();
    for (let i = 0; i < count; i++) {
      visit_(nsArray.objectAtIndex(i));
    }
  };

  visit_(rootView);
}

/**
 * Generates a random unsigned integer.
 */
function randomId() {
  return (1000000 * Math.random()).toFixed(0);
}


/***/ }),

/***/ "./src/command-export-options.js":
/*!***************************************!*\
  !*** ./src/command-export-options.js ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mocha-js-delegate */ "./node_modules/mocha-js-delegate/index.js");
/* harmony import */ var mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var sketch_nibui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! sketch-nibui */ "./node_modules/sketch-nibui/index.js");
/* harmony import */ var _lib_delegate__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/delegate */ "./src/lib/delegate.js");
/* harmony import */ var _prefs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./prefs */ "./src/prefs.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */




/* harmony default export */ __webpack_exports__["default"] = (function (context) {
  var nib = sketch_nibui__WEBPACK_IMPORTED_MODULE_1__["load"](context, 'Prefs');
  var window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer(NSMakeRect(0, 0, nib.rootView.frame().size.width, nib.rootView.frame().size.height), NSTitledWindowMask | NSClosableWindowMask | NSWindowStyleMaskFullSizeContentView, NSBackingStoreBuffered, false);
  window.setDelegate(new mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0___default.a({
    'windowWillClose:': function windowWillClose() {
      return NSApp.stopModal();
    }
  }).getClassInstance());
  window.setContentView(nib.rootView);
  window.setAutorecalculatesKeyViewLoop(true);
  nib.views.saveButton.setKeyEquivalent('\r');
  nib.views.icon.setImage(NSImage.alloc().initWithContentsOfFile(context.plugin.urlForResourceNamed('icon.png').path()));
  var controllers = [new PopUpButtonFieldController(context, {
    view: nib.views.exportScaleField,
    prefKey: 'exportScale',
    options: _prefs__WEBPACK_IMPORTED_MODULE_3__["EXPORT_SCALES"]
  }), // new PopUpButtonFieldController(context, {
  //   view: nib.views.layoutField,
  //   prefKey: 'layout',
  //   options: prefs.LAYOUTS,
  // }),
  new CheckboxFieldController(context, {
    view: nib.views.showHotspotsCheckbox,
    prefKey: 'showHotspots'
  })];
  controllers.forEach(function (c) {
    return c.load();
  });
  var modalDelegate = new mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0___default.a({
    'close:': function close() {
      NSApp.stopModal();
      window.orderOut(null);
    }
  }).getClassInstance();
  NSApp.beginSheet_modalForWindow_modalDelegate_didEndSelector_contextInfo_(window, context.document.documentWindow(), modalDelegate, NSSelectorFromString('close:'), null);
  var returnValue = null;
  _lib_delegate__WEBPACK_IMPORTED_MODULE_2__["setTargetAndAction"](nib.views.setDefaultsButton, function () {
    controllers.forEach(function (c) {
      return c.setAsDefault();
    });
  });
  _lib_delegate__WEBPACK_IMPORTED_MODULE_2__["setTargetAndAction"](nib.views.cancelButton, function () {
    return NSApp.endSheet(window);
  });
  _lib_delegate__WEBPACK_IMPORTED_MODULE_2__["setTargetAndAction"](nib.views.saveButton, function () {
    controllers.forEach(function (c) {
      return c.save();
    });
    NSApp.endSheet(window);
  });
  NSApp.runModalForWindow(window); // blocks
});

var PopUpButtonFieldController =
/*#__PURE__*/
function () {
  function PopUpButtonFieldController(context, _ref) {
    var view = _ref.view,
        prefKey = _ref.prefKey,
        options = _ref.options;

    _classCallCheck(this, PopUpButtonFieldController);

    this.view = view;
    this.context = context;
    this.prefKey = prefKey;
    this.options = options;
  }

  _createClass(PopUpButtonFieldController, [{
    key: "load",
    value: function load() {
      this.refresh_();
    }
  }, {
    key: "refresh_",
    value: function refresh_() {
      var _this = this;

      this.view.removeAllItems();
      var currentValue = _prefs__WEBPACK_IMPORTED_MODULE_3__["resolveDocumentPrefs"](context, context.document)[this.prefKey];
      var defaultValue = _prefs__WEBPACK_IMPORTED_MODULE_3__["getUserOrDefaultPrefs"](context)[this.prefKey];
      this.options.forEach(function (_ref2) {
        var value = _ref2.value,
            label = _ref2.label;
        var def = value == defaultValue ? ' (default)' : '';

        _this.view.addItemWithTitle("".concat(label).concat(def));
      });
      var indexOfCurrent = this.options.findIndex(function (_ref3) {
        var value = _ref3.value;
        return value == currentValue;
      });

      if (indexOfCurrent >= 0) {
        this.view.selectItemAtIndex(indexOfCurrent);
      }
    }
  }, {
    key: "save",
    value: function save() {
      var selectedIndex = this.view.indexOfSelectedItem();
      var value = this.options[selectedIndex].value;
      var defaultValue = _prefs__WEBPACK_IMPORTED_MODULE_3__["getUserOrDefaultPrefs"](context)[this.prefKey];

      if (value == defaultValue) {
        value = null;
      }

      var updateDict = {};
      updateDict[this.prefKey] = value;
      _prefs__WEBPACK_IMPORTED_MODULE_3__["updateDocumentPrefs"](context, context.document, updateDict);
    }
  }, {
    key: "setAsDefault",
    value: function setAsDefault() {
      var selectedIndex = this.view.indexOfSelectedItem();
      var value = this.options[selectedIndex].value;
      var updateDict = {};
      updateDict[this.prefKey] = value;
      _prefs__WEBPACK_IMPORTED_MODULE_3__["updateUserPrefs"](context, updateDict);
      this.refresh_();
      this.view.selectItemAtIndex(selectedIndex);
    }
  }]);

  return PopUpButtonFieldController;
}();

var CheckboxFieldController =
/*#__PURE__*/
function () {
  function CheckboxFieldController(context, _ref4) {
    var view = _ref4.view,
        prefKey = _ref4.prefKey;

    _classCallCheck(this, CheckboxFieldController);

    this.view = view;
    this.context = context;
    this.prefKey = prefKey;
  }

  _createClass(CheckboxFieldController, [{
    key: "load",
    value: function load() {
      var currentValue = !!_prefs__WEBPACK_IMPORTED_MODULE_3__["resolveDocumentPrefs"](context, context.document)[this.prefKey];
      this.view.setState(currentValue ? NSControlStateValueOn : NSControlStateValueOff);
    }
  }, {
    key: "save",
    value: function save() {
      var value = this.view.state() == NSControlStateValueOn;
      var updateDict = {};
      updateDict[this.prefKey] = value;
      _prefs__WEBPACK_IMPORTED_MODULE_3__["updateDocumentPrefs"](context, context.document, updateDict);
    }
  }, {
    key: "setAsDefault",
    value: function setAsDefault() {
      var value = this.view.state() == NSControlStateValueOn;
      var updateDict = {};
      updateDict[this.prefKey] = value;
      _prefs__WEBPACK_IMPORTED_MODULE_3__["updateUserPrefs"](context, updateDict);
    }
  }]);

  return CheckboxFieldController;
}();

/***/ }),

/***/ "./src/lib/delegate.js":
/*!*****************************!*\
  !*** ./src/lib/delegate.js ***!
  \*****************************/
/*! exports provided: setTargetAndAction */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTargetAndAction", function() { return setTargetAndAction; });
/* harmony import */ var mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! mocha-js-delegate */ "./node_modules/mocha-js-delegate/index.js");
/* harmony import */ var mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function setTargetAndAction(view, fn) {
  var delegate = new mocha_js_delegate__WEBPACK_IMPORTED_MODULE_0___default.a({
    'action:': fn
  }).getClassInstance();
  view.setTarget(delegate);
  view.setAction(NSSelectorFromString('action:'));
}

/***/ }),

/***/ "./src/lib/plugin-user-prefs.js":
/*!**************************************!*\
  !*** ./src/lib/plugin-user-prefs.js ***!
  \**************************************/
/*! exports provided: set, get */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "set", function() { return set; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Sets a preference for the plugin with the given key and value.
 */
function set(context, key, value) {
  var userDefaults = getUserDefaults(context);
  userDefaults.setObject_forKey_(JSON.stringify(value), key);
  userDefaults.synchronize(); // save
}
;
/**
 * Gets the value for the given preference.
 */

function get(context, key, defaultValue) {
  var userDefaults = getUserDefaults(context);
  var storedValue = userDefaults.stringForKey_(key);

  try {
    var val = JSON.parse(storedValue);

    if (val === null || val === undefined) {
      return defaultValue;
    }

    return val;
  } catch (e) {
    return defaultValue;
  }
}

function getUserDefaults(context) {
  var pluginId = String(context.plugin.identifier());
  return NSUserDefaults.alloc().initWithSuiteName(pluginId);
}

/***/ }),

/***/ "./src/prefs.js":
/*!**********************!*\
  !*** ./src/prefs.js ***!
  \**********************/
/*! exports provided: EXPORT_SCALES, resolveDocumentPrefs, getDefaultPrefs, getUserOrDefaultPrefs, getUserPrefs, updateUserPrefs, setUserPrefs, getDocumentPrefs, updateDocumentPrefs, setDocumentPrefs */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EXPORT_SCALES", function() { return EXPORT_SCALES; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resolveDocumentPrefs", function() { return resolveDocumentPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDefaultPrefs", function() { return getDefaultPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUserOrDefaultPrefs", function() { return getUserOrDefaultPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUserPrefs", function() { return getUserPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateUserPrefs", function() { return updateUserPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setUserPrefs", function() { return setUserPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDocumentPrefs", function() { return getDocumentPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateDocumentPrefs", function() { return updateDocumentPrefs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDocumentPrefs", function() { return setDocumentPrefs; });
/* harmony import */ var _lib_plugin_user_prefs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib/plugin-user-prefs */ "./src/lib/plugin-user-prefs.js");
/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var PREFS_KEY = 'export_options';
var EXPORT_SCALES = [{
  value: 1,
  label: '1x'
}, {
  value: 2,
  label: '2x'
}]; // export const LAYOUTS = [
//   { value: 'simple', label: 'Simple' },
//   { value: 'centered', label: 'Centered' },
// ];

var DEFAULTS = {
  exportScale: 1,
  // layout: 'simple',
  showHotspots: true
};
function resolveDocumentPrefs(context, document) {
  return Object.assign(getUserOrDefaultPrefs(context), getDocumentPrefs(context, document));
}
function getDefaultPrefs() {
  return Object.assign({}, DEFAULTS);
}
function getUserOrDefaultPrefs(context) {
  return Object.assign(getDefaultPrefs(), getUserPrefs(context));
}
function getUserPrefs(context) {
  return _lib_plugin_user_prefs__WEBPACK_IMPORTED_MODULE_0__["get"](context, PREFS_KEY, {});
}
function updateUserPrefs(context, prefs) {
  prefs = Object.assign(getUserPrefs(context), prefs);

  for (var k in prefs) {
    if (prefs[k] === null) {
      delete prefs[k];
    }
  }

  setUserPrefs(context, prefs);
}
function setUserPrefs(context, prefs) {
  _lib_plugin_user_prefs__WEBPACK_IMPORTED_MODULE_0__["set"](context, PREFS_KEY, prefs);
}
function getDocumentPrefs(context, document) {
  var v = context.command.valueForKey_onDocument_(PREFS_KEY, document.documentData()) || {}; // convert v to a more pure JS object by serializing to JSON in Cocoa

  var jsonData = NSJSONSerialization.dataWithJSONObject_options_error_(v, 0, null);
  var jsonString = NSString.alloc().initWithData_encoding_(jsonData, NSUTF8StringEncoding);
  return JSON.parse(jsonString) || {};
}
function updateDocumentPrefs(context, document, prefs) {
  prefs = Object.assign(getDocumentPrefs(context, document), prefs);

  for (var k in prefs) {
    if (prefs[k] === null) {
      delete prefs[k];
    }
  }

  setDocumentPrefs(context, document, prefs);
}
function setDocumentPrefs(context, document, prefs) {
  context.command.setValue_forKey_onDocument_(prefs, PREFS_KEY, document.documentData());
}

/***/ })

/******/ });
  if (key === 'default' && typeof exports === 'function') {
    exports(context);
  } else {
    exports[key](context);
  }
}
that['onRun'] = __skpm_run.bind(this, 'default')

//# sourceMappingURL=command-export-options.js.map