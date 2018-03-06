const sketch = require('sketch/dom');
const {Document, Page, Artboard, Rectangle, Flow, HotSpot} = sketch;
const async = require('sketch/async');
const dialog = require('@skpm/dialog');
const DataSupplier = require('sketch/data-supplier');
const UI = require('sketch/ui');
const Settings = require('sketch/settings');
const fs = require('@skpm/fs');
const path = require('@skpm/path');

export default function(context) {
  let document = Document.getSelectedDocument();
  let page = document.selectedPage;

  let prototypeData = {
    flowStartArtboardId: null,
    artboards: {},
  };

  let artboardsById = {};

  let flowStartArtboard = null;
  let firstArtboard = null;

  // find starting artboard
  page.layers.forEach(artboard => {
    if (!(artboard instanceof Artboard)) {
      return;
    }

    if (!firstArtboard) {
      firstArtboard = artboard;
    }

    artboardsById[artboard.id] = artboard;

    if (artboard.flowStartPoint) {
      flowStartArtboard = artboard;
    }
  });

  // error out if not found
  if (!flowStartArtboard) {
    flowStartArtboard = firstArtboard;
  }

  // ask user to pick a directory
  let defaultExportPath = '';
  if (document.sketchObject.fileURL()) {
    defaultExportPath = path.dirname(String(document.sketchObject.fileURL().path()));
    // defaultExportPath = path.join(defaultExportPath, 'kitchensink');
  }

  let filePath = dialog.showSaveDialog(document.sketchObject, {
    defaultPath: defaultExportPath,
    nameFieldLabel: 'Export directory name:',
    buttonLabel: 'Export',
    // properties: ['openDirectory', 'createDirectory'],
  });

  // given directory, output to it
  if (!filePath) {
    return;
  }

  let rootPath = filePath;
  // UI.message(rootPath);
  // return;
  if (fs.existsSync(rootPath)) {
    fs.rmdirSync(rootPath);
  }

  prototypeData.flowStartArtboardId = flowStartArtboard.id;

  if (!flowStartArtboard) {
    UI.message('❌ No artboards on the page');
    return;
  }

  let artboardsToProcess = [flowStartArtboard.id];
  let processedArtboards = {};

  // process artboards
  let processNextArtboard_ = () => {
    let artboard = artboardsById[artboardsToProcess.shift()];
    if (processedArtboards[artboard.id]) {
      return;
    }

    processedArtboards[artboard.id] = true;

    // export the artboard image to PNG
    sketch.export(artboard, {
      formats: 'png',
      'use-id-for-name': true,
      overwriting: true,
      output: rootPath,
      // scales: '2',
    });

    // prepare metadata
    let artboardData = {
      name: artboard.name,
      width: artboard.frame.width,
      height: artboard.frame.height,
      hotspots: []
    };

    walkLayerTree(artboard.sketchObject, nativeLayer => {
      // TODO: switch to non-native walkLayerTree once MSHotSpotLayer has an API wrapper
      let layer = sketch.fromNative(nativeLayer);
      let nativeFlow = nativeLayer.flow();
      if (nativeFlow) {
        let rectangle = new Rectangle(nativeLayer.frame().x(), nativeLayer.frame().y(), nativeLayer.frame().width(), nativeLayer.frame().height());
        let parent = nativeLayer.parentGroup();
        while (parent && !(parent instanceof MSArtboardGroup)) {
          rectangle.offset(parent.frame().x(), parent.frame().y());
          parent = parent.parentGroup();
        }

        let hotspotData = {
          rectangle,
          target: String(nativeFlow.destinationArtboardID()), // can be "back" (Flow.BackTarget)
        };

        if (!nativeFlow.isBackAction() && nativeFlow.isValidFlowConnection()) {
          artboardsToProcess.push(String(nativeFlow.destinationArtboardID()));
        }

        artboardData.hotspots.push(hotspotData);
      }
    });

    // store metadata
    prototypeData.artboards[artboard.id] = artboardData;
  };

  while (artboardsToProcess.length) {
    processNextArtboard_();
  }

  let htmlPath = `${rootPath}/index.html`;
  fs.writeFileSync(htmlPath, makeIndexHtml(context, prototypeData));
  NSWorkspace.sharedWorkspace().openFile(htmlPath);
  UI.message('✅ Exported!');
}


function makeIndexHtml(context, prototypeData) {
  let template = fs.readFileSync(context.plugin.urlForResourceNamed('index_template.html').path(), {encoding: 'utf8'});
  log(template.constructor);
  let expanded = template.replace('/*###PROTOTYPEDATA###*/', JSON.stringify(prototypeData, null, 2));
  return expanded;
}


/**
 * Returns a JavaScript array copy of the given NSArray.
 */
export function arrayFromNSArray(nsArray) {
  let arr = [];
  for (let i = 0; i < nsArray.count(); i++) {
    arr.push(nsArray.objectAtIndex(i));
  }
  return arr;
}


/**
 * Depth-first traversal for the Sketch DOM
 */
export function walkLayerTree(rootLayer, visitFunction) {
  let visit_ = layer => {
    // visit this layer
    visitFunction(layer);

    // visit children
    let subLayers;
    if ('layers' in layer) {
      subLayers = arrayFromNSArray(layer.layers());
    } else if ('artboards' in layer) {
      subLayers = arrayFromNSArray(layer.artboards());
    } else {
      return;
    }

    subLayers.forEach(subLayer => visit_(subLayer));
  };

  visit_(rootLayer);
}
