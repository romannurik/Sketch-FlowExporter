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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var ObjCClass = __webpack_require__(6).default

module.exports = new ObjCClass({
  options: null,

  'buttonClicked:': function handleButtonClicked(sender) {
    if (this.options.onClicked) {
      this.options.onClicked(sender.tag())
    }
    this.release()
  },

  'button0Clicked:': function handleButtonClicked() {
    if (this.options.onClicked) {
      this.options.onClicked(0)
    }
    this.release()
  },

  'button1Clicked:': function handleButtonClicked() {
    if (this.options.onClicked) {
      this.options.onClicked(1)
    }
    this.release()
  },
})


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports['default'] = function (context) {
  var document = Document.getSelectedDocument();

  var prototypeData = {
    title: null,
    flowStartArtboardId: null,
    artboards: {}
  };

  var artboardsById = {};

  var flowStartArtboards = [];
  var hasArtboards = null;

  // find a starting artboard
  document.pages.forEach(function (page) {
    page.layers.forEach(function (artboard) {
      if (!(artboard instanceof Artboard)) {
        return;
      }

      hasArtboards = true;

      artboardsById[artboard.id] = artboard;

      if (artboard.flowStartPoint) {
        flowStartArtboards.push(artboard);
      }
    });
  });

  // error out if no artboards found
  if (!hasArtboards) {
    UI.message('❌ No artboards in this document');
    return;
  }

  // find the best starting point
  var flowStartArtboard = null;
  if (flowStartArtboards.length) {
    // there are artboards marked as starting points. find the best one
    // TODO: better handling of multiple starting artboards
    flowStartArtboard = flowStartArtboards[0];
  } else {
    // there aren't any artboards marked as starting points, pick a random artboard
    // TODO: better handling of this (e.g. pick the top-left most one on the current page?)
    flowStartArtboard = Object.values(artboardsById)[0];
  }

  // ask user to pick a directory, with default export name pre-filled
  var defaultExportPath = 'ExportedFlow';
  var fileURL = document.sketchObject.fileURL();
  if (fileURL) {
    fileURL = String(fileURL.path());
    // defaultExportPath = path.join(
    //     path.dirname(fileURL),
    var documentName = path.basename(fileURL).replace(/\.[^.]+$/, ''); // strip extension
    prototypeData.title = documentName;
    defaultExportPath = String(documentName) + '_ExportedFlow';
  }

  var rootPath = dialog.showSaveDialog(document.sketchObject, {
    defaultPath: defaultExportPath,
    nameFieldLabel: 'Export directory name:',
    buttonLabel: 'Export'
  });

  if (!rootPath) {
    return;
  }

  // confirm overwrite
  if (fs.existsSync(rootPath)) {
    var confirm = 0 === dialog.showMessageBox(document.sketchObject, {
      type: 'question',
      buttons: ['Overwrite', 'Cancel'],
      title: 'Directory exists, overwrite?',
      message: 'The output directory you chose already exists. Are you sure you want to overwrite it?\n\n' + rootPath,
      icon: NSImage.alloc().initWithContentsOfFile(context.plugin.urlForResourceNamed('icon.png').path())
    });
    if (!confirm) {
      return;
    }
    fs.rmdirSync(rootPath);
  }

  // export!
  prototypeData.flowStartArtboardId = flowStartArtboard.id;

  var artboardsToProcess = [flowStartArtboard.id];
  var processedArtboards = {};

  // process artboards
  var processNextArtboard_ = function () {
    function processNextArtboard_() {
      var artboardId = artboardsToProcess.shift();
      if (!artboardId) {
        return false;
      }

      var artboard = artboardsById[artboardId];
      if (processedArtboards[artboard.id]) {
        return true;
      }

      processedArtboards[artboard.id] = true;

      // export the artboard image to PNG
      sketch['export'](artboard, {
        formats: 'png',
        'use-id-for-name': true,
        overwriting: true,
        output: rootPath
        // scales: '2',
      });

      // prepare metadata
      var artboardData = {
        title: artboard.name,
        width: artboard.frame.width,
        height: artboard.frame.height,
        hotspots: []
      };

      var findHotspotsUnderSubtree_ = function () {
        function findHotspotsUnderSubtree_(nativeParentGroup, hotspotOverrides) {
          walkLayerTree(nativeParentGroup, function (nativeLayer, setSublayers) {
            // TODO: switch to non-native walkLayerTree once MSHotSpotLayer has an API wrapper
            var layer = sketch.fromNative(nativeLayer);
            var layerId = String(nativeLayer.objectID());
            var nativeFlow = nativeLayer.flow();
            if (nativeFlow) {
              var frame = nativeLayer.frame();
              var rectangle = new Rectangle(frame.x(), frame.y(), frame.width(), frame.height());
              var parent = nativeLayer.parentGroup();
              while (parent && !(parent instanceof MSArtboardGroup || parent instanceof MSSymbolMaster)) {
                rectangle.offset(parent.frame().x(), parent.frame().y());
                parent = parent.parentGroup();
              }

              var target = String(nativeFlow.destinationArtboardID());
              if (layerId in hotspotOverrides) {
                target = hotspotOverrides[layerId];
              }

              if (target) {
                if (target !== String(Flow.BackTarget) /* && nativeFlow.isValidFlowConnection()*/) {
                    artboardsToProcess.push(target);
                  }

                var hotspotData = { rectangle: rectangle, target: target };
                artboardData.hotspots.push(hotspotData);
              }
            }

            if (nativeLayer instanceof MSSymbolInstance && doesSymbolInstanceHaveFlows(nativeLayer)) {
              // symbol instance has flows inside it; make a copy of it,
              // detach it to a group, find the hotspots, and then kill the copy
              var overrides = Object.assign({}, nativeLayer.overrides(), hotspotOverrides);
              var dup = nativeLayer.copy();
              nativeLayer.parentGroup().addLayer(dup);
              dup = dup.detachByReplacingWithGroup();
              findHotspotsUnderSubtree_(dup, overrides);
              dup.removeFromParent();
            }
          });
        }

        return findHotspotsUnderSubtree_;
      }();

      findHotspotsUnderSubtree_(artboard.sketchObject, {});

      // store metadata
      prototypeData.artboards[artboard.id] = artboardData;
      return true;
    }

    return processNextArtboard_;
  }();

  while (processNextArtboard_()) {}

  var htmlPath = String(rootPath) + '/index.html';
  fs.writeFileSync(htmlPath, makeIndexHtml(context, prototypeData));
  NSWorkspace.sharedWorkspace().openFile(htmlPath);
  UI.message('✅ Exported!');
};

exports.arrayFromNSArray = arrayFromNSArray;
exports.walkLayerTree = walkLayerTree;
var sketch = __webpack_require__(2);
var Document = sketch.Document,
    Page = sketch.Page,
    Artboard = sketch.Artboard,
    Rectangle = sketch.Rectangle,
    Flow = sketch.Flow,
    HotSpot = sketch.HotSpot;

var UI = __webpack_require__(3);

var dialog = __webpack_require__(4);
var fs = __webpack_require__(10);
var path = __webpack_require__(11);

function doesSymbolInstanceHaveFlows(nativeSymbolInstance) {
  var hasFlows = false;
  // TODO: cache true/false for a given master
  walkLayerTree(nativeSymbolInstance.symbolMaster(), function (nativeLayer) {
    if (nativeLayer.flow()) {
      hasFlows = true;
    }

    if (nativeLayer instanceof MSSymbolInstance && doesSymbolInstanceHaveFlows(nativeLayer)) {
      hasFlows = true;
    }
  });

  return hasFlows;
}

function makeIndexHtml(context, prototypeData) {
  var template = fs.readFileSync(context.plugin.urlForResourceNamed('index_template.html').path(), { encoding: 'utf8' });
  var expanded = template.replace('/*###PROTOTYPEDATA###*/', JSON.stringify(prototypeData, null, 2));
  return expanded;
}

/**
 * Returns a JavaScript array copy of the given NSArray.
 */
function arrayFromNSArray(nsArray) {
  var arr = [];
  for (var i = 0; i < nsArray.count(); i++) {
    arr.push(nsArray.objectAtIndex(i));
  }
  return arr;
}

/**
 * Depth-first traversal for the Sketch DOM
 */
function walkLayerTree(rootLayer, visitFunction) {
  var visit_ = function visit_(layer) {
    // visit this layer
    visitFunction(layer);

    // visit children
    var subLayers = void 0;
    if ('layers' in layer) {
      subLayers = arrayFromNSArray(layer.layers());
    } else if ('artboards' in layer) {
      subLayers = arrayFromNSArray(layer.artboards());
    } else {
      return;
    }

    subLayers.forEach(function (subLayer) {
      return visit_(subLayer);
    });
  };

  visit_(rootLayer);
}

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("sketch/dom");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("sketch/ui");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/* let's try to match the API from Electron's Dialog
(https://github.com/electron/electron/blob/master/docs/api/dialog.md) */

module.exports = {
  showOpenDialog: __webpack_require__(5),
  showSaveDialog: __webpack_require__(8),
  showMessageBox: __webpack_require__(9),
  // showErrorBox: require('./error-box'),
}


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable no-not-accumulator-reassign/no-not-accumulator-reassign */
var RunDelegate = __webpack_require__(0)

// https://github.com/electron/electron/blob/master/docs/api/dialog.md#dialogshowopendialogbrowserwindow-options-callback
module.exports = function openDialog(document, options, callback) {
  if (!document || typeof document.class !== 'function') {
    callback = options
    options = document
    document = undefined
  }
  if (!options) {
    options = {}
  }

  var dialog = NSOpenPanel.openPanel()

  if (options.title) {
    dialog.title = options.title
  }

  if (options.defaultPath) {
    dialog.directoryURL = NSURL.URLWithString(options.defaultPath)
  }

  if (options.buttonLabel) {
    dialog.prompt = options.buttonLabel
  }

  if (options.filters && options.filters.length) {
    var exts = []
    options.filters.forEach(function setFilter(filter) {
      filter.extensions.forEach(function setExtension(ext) {
        exts.push(ext)
      })
    })

    dialog.allowedFileTypes = exts
  }

  if (options.properties && options.properties.length) {
    options.properties.forEach(function setProperty(p) {
      if (p === 'openFile') {
        dialog.canChooseFiles = true
      } else if (p === 'openDirectory') {
        dialog.canChooseDirectories = true
      } else if (p === 'multiSelections') {
        dialog.allowsMultipleSelection = true
      } else if (p === 'showHiddenFiles') {
        dialog.showsHiddenFiles = true
      } else if (p === 'createDirectory') {
        dialog.createDirectory = true
      } else if (p === 'noResolveAliases') {
        dialog.resolvesAliases = false
      } else if (p === 'treatPackageAsDirectory') {
        dialog.treatsFilePackagesAsDirectories = true
      }
    })
  }

  if (options.message) {
    dialog.message = options.message
  }

  var buttonClicked

  function getURLs() {
    var result = []
    var urls = dialog.URLs()
    for (var k = 0; k < urls.length; k += 1) {
      result.push(String(urls[k].path()))
    }

    return result
  }

  if (!document) {
    buttonClicked = dialog.runModal()
    if (buttonClicked == NSOKButton) {
      if (callback) {
        callback(getURLs())
        return undefined
      }
      return getURLs()
    }

    return []
  }

  var nsButtonClass = NSButton.class()

  function findButtonWithTitleInView(title, view) {
    if (!view || !view.subviews || !view.subviews()) {
      return undefined
    }
    var subviews = view.subviews()
    for (var i = 0; i < subviews.length; i += 1) {
      var subview = subviews[i]
      if (
        subview.isKindOfClass(nsButtonClass) &&
        String(subview.title()) == title
      ) {
        return subview
      }
      var foundButton = findButtonWithTitleInView(title, subview)
      if (foundButton) {
        return foundButton
      }
    }
    return undefined
  }

  var cancelButton = findButtonWithTitleInView('Cancel', dialog.contentView())
  var okButton = findButtonWithTitleInView(
    options.buttonLabel || 'Open',
    dialog.contentView()
  )

  var delegate = RunDelegate.new()

  cancelButton.setTarget(delegate)
  cancelButton.setAction(NSSelectorFromString('button1Clicked:'))
  okButton.setTarget(delegate)
  okButton.setAction(NSSelectorFromString('button0Clicked:'))

  var fiber
  if (callback) {
    if (coscript.createFiber) {
      fiber = coscript.createFiber()
    } else {
      coscript.shouldKeepAround = true
    }
  }

  delegate.options = NSDictionary.dictionaryWithDictionary({
    onClicked: function handleEnd(returnCode) {
      if (callback) {
        callback(returnCode == 0 ? getURLs() : undefined)
        NSApp.endSheet(dialog)
        if (fiber) {
          fiber.cleanup()
        } else {
          coscript.shouldKeepAround = false
        }
      } else {
        NSApp.stopModalWithCode(returnCode)
      }
    },
  })

  var window = (document.sketchObject || document).documentWindow()
  dialog.beginSheetForDirectory_file_modalForWindow_modalDelegate_didEndSelector_contextInfo(
    null,
    null,
    window,
    null,
    null,
    null
  )

  if (!callback) {
    buttonClicked = NSApp.runModalForWindow(window)
    NSApp.endSheet(dialog)
    if (buttonClicked == 0) {
      return getURLs()
    }
    return undefined
  }

  return undefined
}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperCall = undefined;
exports.default = ObjCClass;

var _runtime = __webpack_require__(7);

exports.SuperCall = _runtime.SuperCall;

// super when returnType is id and args are void
// id objc_msgSendSuper(struct objc_super *super, SEL op, void)

const SuperInit = (0, _runtime.SuperCall)(NSStringFromSelector("init"), [], { type: "@" });

// Returns a real ObjC class. No need to use new.
function ObjCClass(defn) {
  const superclass = defn.superclass || NSObject;
  const className = (defn.className || defn.classname || "ObjCClass") + NSUUID.UUID().UUIDString();
  const reserved = new Set(['className', 'classname', 'superclass']);
  var cls = MOClassDescription.allocateDescriptionForClassWithName_superclass_(className, superclass);
  // Add each handler to the class description
  const ivars = [];
  for (var key in defn) {
    const v = defn[key];
    if (typeof v == 'function' && key !== 'init') {
      var selector = NSSelectorFromString(key);
      cls.addInstanceMethodWithSelector_function_(selector, v);
    } else if (!reserved.has(key)) {
      ivars.push(key);
      cls.addInstanceVariableWithName_typeEncoding(key, "@");
    }
  }

  cls.addInstanceMethodWithSelector_function_(NSSelectorFromString('init'), function () {
    const self = SuperInit.call(this);
    ivars.map(name => {
      Object.defineProperty(self, name, {
        get() {
          return getIvar(self, name);
        },
        set(v) {
          (0, _runtime.object_setInstanceVariable)(self, name, v);
        }
      });
      self[name] = defn[name];
    });
    // If there is a passsed-in init funciton, call it now.
    if (typeof defn.init == 'function') defn.init.call(this);
    return self;
  });

  return cls.registerClass();
};

function getIvar(obj, name) {
  const retPtr = MOPointer.new();
  (0, _runtime.object_getInstanceVariable)(obj, name, retPtr);
  return retPtr.value().retain().autorelease();
}

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperCall = SuperCall;
exports.CFunc = CFunc;
const objc_super_typeEncoding = '{objc_super="receiver"@"super_class"#}';

// You can store this to call your function. this must be bound to the current instance.
function SuperCall(selector, argTypes, returnType) {
  const func = CFunc("objc_msgSendSuper", [{ type: '^' + objc_super_typeEncoding }, { type: ":" }, ...argTypes], returnType);
  return function (...args) {
    const struct = make_objc_super(this, this.superclass());
    const structPtr = MOPointer.alloc().initWithValue_(struct);
    return func(structPtr, selector, ...args);
  };
}

// Recursively create a MOStruct
function makeStruct(def) {
  if (typeof def !== 'object' || Object.keys(def).length == 0) {
    return def;
  }
  const name = Object.keys(def)[0];
  const values = def[name];

  const structure = MOStruct.structureWithName_memberNames_runtime(name, Object.keys(values), Mocha.sharedRuntime());

  Object.keys(values).map(member => {
    structure[member] = makeStruct(values[member]);
  });

  return structure;
}

function make_objc_super(self, cls) {
  return makeStruct({
    objc_super: {
      receiver: self,
      super_class: cls
    }
  });
}

// Due to particularities of the JS bridge, we can't call into MOBridgeSupport objects directly
// But, we can ask key value coding to do the dirty work for us ;)
function setKeys(o, d) {
  const funcDict = NSMutableDictionary.dictionary();
  funcDict.o = o;
  Object.keys(d).map(k => funcDict.setValue_forKeyPath(d[k], "o." + k));
}

// Use any C function, not just ones with BridgeSupport
function CFunc(name, args, retVal) {
  function makeArgument(a) {
    if (!a) return null;
    const arg = MOBridgeSupportArgument.alloc().init();
    setKeys(arg, {
      type64: a.type
    });
    return arg;
  }
  const func = MOBridgeSupportFunction.alloc().init();
  setKeys(func, {
    name: name,
    arguments: args.map(makeArgument),
    returnValue: makeArgument(retVal)
  });
  return func;
}

/*
@encode(char*) = "*"
@encode(id) = "@"
@encode(Class) = "#"
@encode(void*) = "^v"
@encode(CGRect) = "{CGRect={CGPoint=dd}{CGSize=dd}}"
@encode(SEL) = ":"
*/

function addStructToBridgeSupport(key, structDef) {
  // OK, so this is probably the nastiest hack in this file.
  // We go modify MOBridgeSupportController behind its back and use kvc to add our own definition
  // There isn't another API for this though. So the only other way would be to make a real bridgesupport file.
  const symbols = MOBridgeSupportController.sharedController().valueForKey('symbols');
  if (!symbols) throw Error("Something has changed within bridge support so we can't add our definitions");
  // If someone already added this definition, don't re-register it.
  if (symbols[key] !== null) return;
  const def = MOBridgeSupportStruct.alloc().init();
  setKeys(def, {
    name: key,
    type: structDef.type
  });
  symbols[key] = def;
};

// This assumes the ivar is an object type. Return value is pretty useless.
const object_getInstanceVariable = exports.object_getInstanceVariable = CFunc("object_getInstanceVariable", [{ type: "@" }, { type: '*' }, { type: "^@" }], { type: "^{objc_ivar=}" });
// Again, ivar is of object type
const object_setInstanceVariable = exports.object_setInstanceVariable = CFunc("object_setInstanceVariable", [{ type: "@" }, { type: '*' }, { type: "@" }], { type: "^{objc_ivar=}" });

// We need Mocha to understand what an objc_super is so we can use it as a function argument
addStructToBridgeSupport('objc_super', { type: objc_super_typeEncoding });

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable no-not-accumulator-reassign/no-not-accumulator-reassign */
var RunDelegate = __webpack_require__(0)

// https://github.com/electron/electron/blob/master/docs/api/dialog.md#dialogshowsavedialogbrowserwindow-options-callback
module.exports = function saveDialog(document, options, callback) {
  if (!document || typeof document.class !== 'function') {
    callback = options
    options = document
    document = undefined
  }
  if (!options) {
    options = {}
  }

  var buttonClicked
  var url

  var dialog = NSSavePanel.savePanel()

  if (options.title) {
    dialog.title = options.title
  }

  if (options.defaultPath) {
    if (
      options.defaultPath[0] === '.' ||
      options.defaultPath[0] === '~' ||
      options.defaultPath[0] === '/'
    ) {
      // that's a path
      dialog.setDirectoryURL(
        NSURL.URLWithString(
          NSString.stringWithString(
            options.defaultPath
          ).stringByExpandingTildeInPath()
        )
      )
      var parts = options.defaultPath.split('/')
      if (parts.length > 1 && parts[parts.length - 1]) {
        dialog.setNameFieldStringValue(parts[parts.length - 1])
      }
    } else {
      dialog.setNameFieldStringValue(options.defaultPath)
    }
  }

  if (options.buttonLabel) {
    dialog.prompt = options.buttonLabel
  }

  if (options.filters && options.filters.length) {
    var exts = []
    options.filters.forEach(function setFilter(filter) {
      filter.extensions.forEach(function setExtension(ext) {
        exts.push(ext)
      })
    })

    dialog.allowedFileTypes = exts
  }

  if (options.message) {
    dialog.message = options.message
  }

  if (options.nameFieldLabel) {
    dialog.nameFieldLabel = options.nameFieldLabel
  }

  if (options.showsTagField) {
    dialog.showsTagField = options.showsTagField
  }

  if (!document) {
    buttonClicked = dialog.runModal()
    if (buttonClicked == NSOKButton) {
      url = String(dialog.URL().path())

      if (callback) {
        callback(url)
        return undefined
      }
      return url
    }
    return undefined
  }

  var nsButtonClass = NSButton.class()

  function findButtonWithTitleInView(title, view) {
    if (!view || !view.subviews || !view.subviews()) {
      return undefined
    }
    var subviews = view.subviews()
    for (var i = 0; i < subviews.length; i += 1) {
      var subview = subviews[i]
      if (
        subview.isKindOfClass(nsButtonClass) &&
        String(subview.title()) == title
      ) {
        return subview
      }
      var foundButton = findButtonWithTitleInView(title, subview)
      if (foundButton) {
        return foundButton
      }
    }
    return undefined
  }

  var cancelButton = findButtonWithTitleInView('Cancel', dialog.contentView())
  var okButton = findButtonWithTitleInView(
    options.buttonLabel || 'Save',
    dialog.contentView()
  )

  var delegate = RunDelegate.new()

  cancelButton.setTarget(delegate)
  cancelButton.setAction(NSSelectorFromString('button1Clicked:'))
  okButton.setTarget(delegate)
  okButton.setAction(NSSelectorFromString('button0Clicked:'))

  var fiber
  if (callback) {
    if (coscript.createFiber) {
      fiber = coscript.createFiber()
    } else {
      coscript.shouldKeepAround = true
    }
  }

  delegate.options = NSDictionary.dictionaryWithDictionary({
    onClicked: function handleEnd(returnCode) {
      if (callback) {
        callback(returnCode == 0 ? String(dialog.URL().path()) : undefined)
        NSApp.endSheet(dialog)
        if (fiber) {
          fiber.cleanup()
        } else {
          coscript.shouldKeepAround = false
        }
      } else {
        NSApp.stopModalWithCode(returnCode)
      }
    },
  })

  var window = (document.sketchObject || document).documentWindow()
  dialog.beginSheetForDirectory_file_modalForWindow_modalDelegate_didEndSelector_contextInfo(
    null,
    null,
    window,
    null,
    null,
    null
  )

  if (!callback) {
    buttonClicked = NSApp.runModalForWindow(window)
    NSApp.endSheet(dialog)
    if (buttonClicked == 0) {
      return String(dialog.URL().path())
    }
    return undefined
  }

  return undefined
}


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable no-not-accumulator-reassign/no-not-accumulator-reassign */
var RunDelegate = __webpack_require__(0)

// https://github.com/electron/electron/blob/master/docs/api/dialog.md#dialogshowmessageboxbrowserwindow-options-callback
var typeMap = {
  none: 0,
  info: 1,
  error: 2,
  question: 1,
  warning: 2,
}
module.exports = function messageBox(document, options, callback) {
  if (
    !document ||
    (typeof document.class !== 'function' && !document.sketchObject)
  ) {
    callback = options
    options = document
    document = undefined
  } else if (document.sketchObject) {
    document = document.sketchObject
  }
  if (!options) {
    options = {}
  }

  var response

  var dialog = NSAlert.alloc().init()

  if (options.type) {
    dialog.alertStyle = typeMap[options.type] || 0
  }

  if (options.buttons && options.buttons.length) {
    options.buttons.forEach(function addButton(button) {
      dialog.addButtonWithTitle(
        options.normalizeAccessKeys ? button.replace(/&/g, '') : button
      )
      // TODO: add keyboard shortcut if options.normalizeAccessKeys
    })
  }

  if (typeof options.defaultId !== 'undefined') {
    var buttons = dialog.buttons()
    if (options.defaultId < buttons.length) {
      // Focus the button at defaultId if the user opted to do so.
      // The first button added gets set as the default selected.
      // So remove that default, and make the requested button the default.
      buttons[0].setKeyEquivalent('')
      buttons[options.defaultId].setKeyEquivalent('\r')
    }
  }

  if (options.title) {
    // not shown on macOS
  }

  if (options.message) {
    dialog.messageText = options.message
  }

  if (options.detail) {
    dialog.informativeText = options.detail
  }

  if (options.checkboxLabel) {
    dialog.showsSuppressionButton = true
    dialog.suppressionButton().title = options.checkboxLabel

    if (typeof options.checkboxChecked !== 'undefined') {
      dialog.suppressionButton().state = options.checkboxChecked
        ? NSOnState
        : NSOffState
    }
  }

  if (options.icon) {
    if (typeof options.icon === 'string') {
      options.icon = NSImage.alloc().initWithContentsOfFile(options.icon)
    }
    dialog.icon = options.icon
  } else if (
    typeof __command !== 'undefined' &&
    __command.pluginBundle() &&
    __command.pluginBundle().icon()
  ) {
    dialog.icon = __command.pluginBundle().icon()
  }

  if (!document) {
    response = Number(dialog.runModal()) - 1000
    if (callback) {
      var checkboxChecked = false
      if (options.checkboxLabel) {
        checkboxChecked = dialog.suppressionButton().state() == NSOnState
      }
      callback({
        response: response,
        checkboxChecked: checkboxChecked,
      })
      return undefined
    }
    return response
  }

  var delegate = RunDelegate.new()

  dialog.buttons().forEach(function hookButton(button, i) {
    button.setTarget(delegate)
    button.setAction(NSSelectorFromString('buttonClicked:'))
    button.setTag(i)
  })

  var fiber
  if (callback) {
    if (coscript.createFiber) {
      fiber = coscript.createFiber()
    } else {
      coscript.shouldKeepAround = true
    }
  }

  delegate.options = NSDictionary.dictionaryWithDictionary({
    onClicked: function handleEnd(returnCode) {
      if (callback) {
        callback({
          response: Number(returnCode),
          checkboxChecked: dialog.suppressionButton().state() == NSOnState,
        })
        NSApp.endSheet(dialog.window())
        if (fiber) {
          fiber.cleanup()
        } else {
          coscript.shouldKeepAround = false
        }
      } else {
        NSApp.stopModalWithCode(Number(returnCode))
      }
    },
  })

  var window = (document.sketchObject || document).documentWindow()
  dialog.beginSheetModalForWindow_modalDelegate_didEndSelector_contextInfo(
    window,
    null,
    null,
    null
  )

  if (!callback) {
    response = Number(NSApp.runModalForWindow(window))
    NSApp.endSheet(dialog.window())
    return response
  }

  return undefined
}


/***/ }),
/* 10 */
/***/ (function(module, exports) {

// TODO: async. Should probably be done with NSFileHandle and some notifications
// TODO: file descriptor. Needs to be done with NSFileHandle

module.exports.constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
}

module.exports.accessSync = function(path, mode) {
  mode = mode | 0
  var fileManager = NSFileManager.defaultManager()

  switch (mode) {
    case 0:
      return module.exports.existsSync(path)
    case 1:
      return Boolean(fileManager.isExecutableFileAtPath(path))
    case 2:
      return Boolean(fileManager.isWritableFileAtPath(path))
    case 3:
      return Boolean(fileManager.isExecutableFileAtPath(path) && fileManager.isWritableFileAtPath(path))
    case 4:
      return Boolean(fileManager.isReadableFileAtPath(path))
    case 5:
      return Boolean(fileManager.isReadableFileAtPath(path) && fileManager.isExecutableFileAtPath(path))
    case 6:
      return Boolean(fileManager.isReadableFileAtPath(path) && fileManager.isWritableFileAtPath(path))
    case 7:
      return Boolean(fileManager.isReadableFileAtPath(path) && fileManager.isWritableFileAtPath(path) && fileManager.isExecutableFileAtPath(path))
  }
}

module.exports.appendFileSync = function(file, data, options) {
  if (!module.exports.existsSync(file)) {
    data.writeToFile_atomically(file, true)
  } else {
    var handle = NSFileHandle.fileHandleForWritingAtPath(file)
    handle.seekToEndOfFile()
    handle.writeData(data.dataUsingEncoding(NSUTF8StringEncoding))
  }
}

module.exports.chmodSync = function(path, mode) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  fileManager.setAttributes_ofItemAtPath_error({
    NSFilePosixPermissions: mode
  }, path, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.copyFileSync = function(path, dest, flags) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  fileManager.copyItemAtPath_toPath_error(path, dest, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.existsSync = function(path) {
  var fileManager = NSFileManager.defaultManager()
  return Boolean(fileManager.fileExistsAtPath(path))
}

module.exports.linkSync = function(existingPath, newPath) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  fileManager.linkItemAtPath_toPath_error(existingPath, newPath, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.mkdirSync = function(path, mode) {
  mode = mode || 0o777
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(path, false, {
    NSFilePosixPermissions: mode
  }, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.mkdtempSync = function(path) {
  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
  var tempPath = path + makeid()
  module.exports.mkdirSync(tempPath)
  return tempPath
}

module.exports.readdirSync = function(path) {
  var fileManager = NSFileManager.defaultManager()
  var paths = fileManager.subpathsAtPath(path)
  var arr = []
  for (var i = 0; i < paths.length; i++) {
    arr.push(paths[i])
  }
  return arr
}

module.exports.readFileSync = function(path, options) {
  var encoding = options && options.encoding ? options.encoding : (options ? options : 'buffer')
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  var data = fileManager.contentsAtPath(path)
  switch (encoding) {
    case 'utf8':
      return String(NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding))
    case 'ascii':
      return String(NSString.alloc().initWithData_encoding(data, NSASCIIStringEncoding))
    case 'utf16le':
    case 'ucs2':
      return String(NSString.alloc().initWithData_encoding(data, NSUTF16LittleEndianStringEncoding))
    case 'base64':
      var nsdataDecoded = NSData.alloc().initWithBase64EncodedData_options(data, 0)
      return String(NSString.alloc().initWithData_encoding(nsdataDecoded, NSUTF8StringEncoding))
    case 'latin1':
    case 'binary':
      return String(NSString.alloc().initWithData_encoding(data, NSISOLatin1StringEncoding))
    case 'hex':
      // TODO: how?
      return data
    default:
      return data
  }
}

module.exports.readlinkSync = function(path) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  var result = fileManager.destinationOfSymbolicLinkAtPath_error(path, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }

  return result
}

module.exports.realpathSync = function(path) {
  return NSString.stringByResolvingSymlinksInPath(path)
}

module.exports.renameSync = function(oldPath, newPath) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  fileManager.moveItemAtPath_toPath_error(oldPath, newPath, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.rmdirSync = function(path) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  fileManager.removeItemAtPath_error(path, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.statSync = function(path) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  var result = fileManager.attributesOfItemAtPath_error(path, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }

  return {
    dev: String(result.NSFileDeviceIdentifier),
    // ino: 48064969, The file system specific "Inode" number for the file.
    mode: result.NSFileType | result.NSFilePosixPermissions,
    nlink: Number(result.NSFileReferenceCount),
    uid: String(result.NSFileOwnerAccountID),
    gid: String(result.NSFileGroupOwnerAccountID),
    // rdev: 0, A numeric device identifier if the file is considered "special".
    size: Number(result.NSFileSize),
    // blksize: 4096, The file system block size for i/o operations.
    // blocks: 8, The number of blocks allocated for this file.
    atimeMs: Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000,
    mtimeMs: Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000,
    ctimeMs: Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000,
    birthtimeMs: Number(result.NSFileCreationDate.timeIntervalSince1970()) * 1000,
    atime: new Date(Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000 + 0.5), // the 0.5 comes from the node source. Not sure why it's added but in doubt...
    mtime: new Date(Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000 + 0.5),
    ctime: new Date(Number(result.NSFileModificationDate.timeIntervalSince1970()) * 1000 + 0.5),
    birthtime: new Date(Number(result.NSFileCreationDate.timeIntervalSince1970()) * 1000 + 0.5),
    isBlockDevice: function() { return result.NSFileType === NSFileTypeBlockSpecial },
    isCharacterDevice: function() { return result.NSFileType === NSFileTypeCharacterSpecial },
    isDirectory: function() { return result.NSFileType === NSFileTypeDirectory },
    isFIFO: function() { return false },
    isFile: function() { return result.NSFileType === NSFileTypeRegular },
    isSocket: function() { return result.NSFileType === NSFileTypeSocket },
    isSymbolicLink: function() { return result.NSFileType === NSFileTypeSymbolicLink },
  }
}

module.exports.symlinkSync = function(target, path) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  var result = fileManager.createSymbolicLinkAtPath_withDestinationPath_error(path, target, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.truncateSync = function(path, len) {
  var hFile = NSFileHandle.fileHandleForUpdatingAtPath(sFilePath)
  hFile.truncateFileAtOffset(len || 0)
  hFile.closeFile()
}

module.exports.unlinkSync = function(path) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  var result = fileManager.removeItemAtPath_error(path, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.utimesSync = function(path, aTime, mTime) {
  var err = MOPointer.alloc().init()
  var fileManager = NSFileManager.defaultManager()
  var result = fileManager.setAttributes_ofItemAtPath_error({
    NSFileModificationDate: aTime
  }, path, err)

  if (err.value() !== null) {
    throw new Error(err.value())
  }
}

module.exports.writeFileSync = function(path, data, options) {
  var encoding = options && options.encoding ? options.encoding : (options ? options : 'utf8')

  if (data && data.mocha && data.mocha().class() === 'NSData') {
    data.writeToFile_atomically(path, true)
    return
  }

  var err = MOPointer.alloc().init()
  var string = NSString.stringWithString(data)

  switch (encoding) {
    case 'utf8':
      string.writeToFile_atomically_encoding_error(path, true, NSUTF8StringEncoding, err)
      return
    case 'ascii':
      string.writeToFile_atomically_encoding_error(path, true, NSASCIIStringEncoding)
      return
    case 'utf16le':
    case 'ucs2':
      string.writeToFile_atomically_encoding_error(path, true, NSUTF16LittleEndianStringEncoding)
      return
    case 'base64':
      var plainData = string.dataUsingEncoding(NSUTF8StringEncoding)
      var nsdataEncoded = plainData.base64EncodedStringWithOptions(0)
      nsdataEncoded.writeToFile_atomically(path, true)
      return
    case 'latin1':
    case 'binary':
      string.writeToFile_atomically_encoding_error(path, true, NSISOLatin1StringEncoding)
      return
    case 'hex':
      // TODO: how?
    default:
      string.writeToFile_atomically_encoding_error(path, true, NSUTF8StringEncoding, err)
      return
  }
}


/***/ }),
/* 11 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// we only expose the posix implementation since Sketch only runs on macOS

var CHAR_FORWARD_SLASH = 47
var CHAR_DOT = 46

// Resolves . and .. elements in a path with directory names
function normalizeString(path, allowAboveRoot) {
  var res = ''
  var lastSegmentLength = 0
  var lastSlash = -1
  var dots = 0
  var code
  for (var i = 0; i <= path.length; i += 1) {
    if (i < path.length) code = path.charCodeAt(i)
    else if (code === CHAR_FORWARD_SLASH) break
    else code = CHAR_FORWARD_SLASH
    if (code === CHAR_FORWARD_SLASH) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/')
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = ''
                lastSegmentLength = 0
              } else {
                res = res.slice(0, lastSlashIndex)
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/')
              }
              lastSlash = i
              dots = 0
              continue
            }
          } else if (res.length === 2 || res.length === 1) {
            res = ''
            lastSegmentLength = 0
            lastSlash = i
            dots = 0
            continue
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += '/..'
          else res = '..'
          lastSegmentLength = 2
        }
      } else {
        if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i)
        else res = path.slice(lastSlash + 1, i)
        lastSegmentLength = i - lastSlash - 1
      }
      lastSlash = i
      dots = 0
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots
    } else {
      dots = -1
    }
  }
  return res
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root
  var base =
    pathObject.base || (pathObject.name || '') + (pathObject.ext || '')
  if (!dir) {
    return base
  }
  if (dir === pathObject.root) {
    return dir + base
  }
  return dir + sep + base
}

function normalizePath(path) {
  if (typeof path === 'string') {
    return path
  }
  if (path && path.class && typeof path.class === 'function') {
    const className = String(path.class())
    if (className === 'NSString') {
      return String(path)
    } else if (className === 'NSURL') {
      return String(path.path())
    }
  }
  throw new Error('path should be a string')
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = ''
    var resolvedAbsolute = false
    var cwd

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i -= 1) {
      var path
      if (i >= 0) path = arguments[i]
      else {
        if (cwd === undefined)
          cwd = posix.dirname(String(__command.script().URL().path()) || MSPluginManager.defaultPluginURL())
        path = cwd
      }

      path = normalizePath(path)

      // Skip empty entries
      if (path.length === 0) {
        continue
      }

      resolvedPath = path + '/' + resolvedPath
      resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute)

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0) return '/' + resolvedPath
      else return '/'
    } else if (resolvedPath.length > 0) {
      return resolvedPath
    } else {
      return '.'
    }
  },

  normalize: function normalize(path) {
    path = normalizePath(path)

    if (path.length === 0) return '.'

    var isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH
    var trailingSeparator =
      path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH

    // Normalize the path
    path = normalizeString(path, !isAbsolute)

    if (path.length === 0 && !isAbsolute) path = '.'
    if (path.length > 0 && trailingSeparator) path += '/'

    if (isAbsolute) return '/' + path
    return path
  },

  isAbsolute: function isAbsolute(path) {
    path = normalizePath(path)
    return path.length > 0 && path.charCodeAt(0) === CHAR_FORWARD_SLASH
  },

  join: function join() {
    if (arguments.length === 0) return '.'
    var joined
    for (var i = 0; i < arguments.length; i += 1) {
      var arg = arguments[i]
      arg = normalizePath(arg)
      if (arg.length > 0) {
        if (joined === undefined) joined = arg
        else joined += '/' + arg
      }
    }
    if (joined === undefined) return '.'
    return posix.normalize(joined)
  },

  relative: function relative(from, to) {
    from = normalizePath(from)
    to = normalizePath(to)

    if (from === to) return ''

    from = posix.resolve(from)
    to = posix.resolve(to)

    if (from === to) return ''

    // Trim any leading backslashes
    var fromStart = 1
    for (; fromStart < from.length; fromStart += 1) {
      if (from.charCodeAt(fromStart) !== CHAR_FORWARD_SLASH) break
    }
    var fromEnd = from.length
    var fromLen = fromEnd - fromStart

    // Trim any leading backslashes
    var toStart = 1
    for (; toStart < to.length; toStart += 1) {
      if (to.charCodeAt(toStart) !== CHAR_FORWARD_SLASH) break
    }
    var toEnd = to.length
    var toLen = toEnd - toStart

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen
    var lastCommonSep = -1
    var i = 0
    for (; i <= length; i += 1) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === CHAR_FORWARD_SLASH) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1)
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i)
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === CHAR_FORWARD_SLASH) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0
          }
        }
        break
      }
      var fromCode = from.charCodeAt(fromStart + i)
      var toCode = to.charCodeAt(toStart + i)
      if (fromCode !== toCode) break
      else if (fromCode === CHAR_FORWARD_SLASH) lastCommonSep = i
    }

    var out = ''
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; i += 1) {
      if (i === fromEnd || from.charCodeAt(i) === CHAR_FORWARD_SLASH) {
        if (out.length === 0) out += '..'
        else out += '/..'
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep)
    else {
      toStart += lastCommonSep
      if (to.charCodeAt(toStart) === CHAR_FORWARD_SLASH) toStart += 1
      return to.slice(toStart)
    }
  },

  toNamespacedPath: function toNamespacedPath(path) {
    // Non-op on posix systems
    return path
  },

  dirname: function dirname(path) {
    path = normalizePath(path)
    if (path.length === 0) return '.'
    var code = path.charCodeAt(0)
    var hasRoot = code === CHAR_FORWARD_SLASH
    var end = -1
    var matchedSlash = true
    for (var i = path.length - 1; i >= 1; i -= 1) {
      code = path.charCodeAt(i)
      if (code === CHAR_FORWARD_SLASH) {
        if (!matchedSlash) {
          end = i
          break
        }
      } else {
        // We saw the first non-path separator
        matchedSlash = false
      }
    }

    if (end === -1) return hasRoot ? '/' : '.'
    if (hasRoot && end === 1) return '//'
    return path.slice(0, end)
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string')
      throw new Error('ext should be a string')
    path = normalizePath(path)

    var start = 0
    var end = -1
    var matchedSlash = true
    var i

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return ''
      var extIdx = ext.length - 1
      var firstNonSlashEnd = -1
      for (i = path.length - 1; i >= 0; i -= 1) {
        var code = path.charCodeAt(i)
        if (code === CHAR_FORWARD_SLASH) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            start = i + 1
            break
          }
        } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false
            firstNonSlashEnd = i + 1
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1
              end = firstNonSlashEnd
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd
      else if (end === -1) end = path.length
      return path.slice(start, end)
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            start = i + 1
            break
          }
        } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false
          end = i + 1
        }
      }

      if (end === -1) return ''
      return path.slice(start, end)
    }
  },

  extname: function extname(path) {
    path = normalizePath(path)
    var startDot = -1
    var startPart = 0
    var end = -1
    var matchedSlash = true
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i)
      if (code === CHAR_FORWARD_SLASH) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1
          break
        }
        continue
      }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false
        end = i + 1
      }
      if (code === CHAR_DOT) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1) startDot = i
        else if (preDotState !== 1) preDotState = 1
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1
      }
    }

    if (
      startDot === -1 ||
      end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    ) {
      return ''
    }
    return path.slice(startDot, end)
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new Error('pathObject should be an Object')
    }
    return _format('/', pathObject)
  },

  parse: function parse(path) {
    path = normalizePath(path)

    var ret = { root: '', dir: '', base: '', ext: '', name: '' }
    if (path.length === 0) return ret
    var code = path.charCodeAt(0)
    var isAbsolute = code === CHAR_FORWARD_SLASH
    var start
    if (isAbsolute) {
      ret.root = '/'
      start = 1
    } else {
      start = 0
    }
    var startDot = -1
    var startPart = 0
    var end = -1
    var matchedSlash = true
    var i = path.length - 1

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i)
      if (code === CHAR_FORWARD_SLASH) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1
          break
        }
        continue
      }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false
        end = i + 1
      }
      if (code === CHAR_DOT) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1) startDot = i
        else if (preDotState !== 1) preDotState = 1
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1
      }
    }

    if (
      startDot === -1 ||
      end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    ) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute)
          ret.base = ret.name = path.slice(1, end)
        else ret.base = ret.name = path.slice(startPart, end)
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot)
        ret.base = path.slice(1, end)
      } else {
        ret.name = path.slice(startPart, startDot)
        ret.base = path.slice(startPart, end)
      }
      ret.ext = path.slice(startDot, end)
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1)
    else if (isAbsolute) ret.dir = '/'

    return ret
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null,
}

posix.posix = posix

module.exports = posix


/***/ })
/******/ ]);
  if (key === 'default' && typeof exports === 'function') {
    exports(context);
  } else {
    exports[key](context);
  }
}
that['onRun'] = __skpm_run.bind(this, 'default')
