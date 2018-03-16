const sketch = require('sketch/dom');
const {Document, Page, Artboard, Rectangle, Flow, HotSpot} = sketch;
const UI = require('sketch/ui');

const dialog = require('@skpm/dialog');
const fs = require('@skpm/fs');
const path = require('@skpm/path');


export default function(context) {
  let document = Document.getSelectedDocument();

  let prototypeData = {
    title: null,
    flowStartArtboardId: null,
    artboards: {},
  };

  let artboardsById = {};

  let flowStartArtboards = [];
  let hasArtboards = null;

  // find a starting artboard
  document.pages.forEach(page => {
    page.layers.forEach(artboard => {
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
  let flowStartArtboard = null;
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
  let defaultExportPath = 'ExportedFlow';
  let fileURL = document.sketchObject.fileURL();
  if (fileURL) {
    fileURL = String(fileURL.path());
    // defaultExportPath = path.join(
    //     path.dirname(fileURL),
    let documentName = path.basename(fileURL).replace(/\.[^.]+$/, ''); // strip extension
    prototypeData.title = documentName;
    defaultExportPath = `${documentName}_ExportedFlow`;
  }

  let rootPath = dialog.showSaveDialog(document.sketchObject, {
    defaultPath: defaultExportPath,
    nameFieldLabel: 'Export directory name:',
    buttonLabel: 'Export',
  });

  if (!rootPath) {
    return;
  }

  // confirm overwrite
  if (fs.existsSync(rootPath)) {
    let confirm = (0 === dialog.showMessageBox(document.sketchObject, {
      type: 'question',
      buttons: ['Overwrite', 'Cancel'],
      title: 'Directory exists, overwrite?',
      message: 'The output directory you chose already exists. Are you sure you want to overwrite it?\n\n' + rootPath,
      icon: NSImage.alloc().initWithContentsOfFile(context.plugin.urlForResourceNamed('icon.png').path()),
    }));
    if (!confirm) {
      return;
    }
    fs.rmdirSync(rootPath);
  }

  // export!
  prototypeData.flowStartArtboardId = flowStartArtboard.id;

  let artboardsToProcess = [flowStartArtboard.id];
  let processedArtboards = {};

  // process artboards
  let processNextArtboard_ = () => {
    let artboardId = artboardsToProcess.shift();
    if (!artboardId) {
      return false;
    }

    let artboard = artboardsById[artboardId];
    if (processedArtboards[artboard.id]) {
      return true;
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
      title: artboard.name,
      width: artboard.frame.width,
      height: artboard.frame.height,
      hotspots: []
    };

    let findHotspotsUnderSubtree_ = (nativeParentGroup, hotspotOverrides) => {
      walkLayerTree(nativeParentGroup, (nativeLayer, setSublayers) => {
        // TODO: switch to non-native walkLayerTree once MSHotSpotLayer has an API wrapper
        let layer = sketch.fromNative(nativeLayer);
        let layerId = String(nativeLayer.objectID());
        let nativeFlow = nativeLayer.flow();
        if (nativeFlow) {
          let frame = nativeLayer.frame();
          let rectangle = new Rectangle(frame.x(), frame.y(), frame.width(), frame.height());
          let parent = nativeLayer.parentGroup();
          while (parent && !(parent instanceof MSArtboardGroup || parent instanceof MSSymbolMaster)) {
            rectangle.offset(parent.frame().x(), parent.frame().y());
            parent = parent.parentGroup();
          }

          let target = String(nativeFlow.destinationArtboardID());
          if (layerId in hotspotOverrides) {
            target = hotspotOverrides[layerId];
          }

          if (target) {
            if (target !== String(Flow.BackTarget)/* && nativeFlow.isValidFlowConnection()*/) {
              artboardsToProcess.push(target);
            }

            let hotspotData = {rectangle, target};
            artboardData.hotspots.push(hotspotData);
          }
        }

        if (nativeLayer instanceof MSSymbolInstance && doesSymbolInstanceHaveFlows(nativeLayer)) {
          // symbol instance has flows inside it; make a copy of it,
          // detach it to a group, find the hotspots, and then kill the copy
          let overrides = {...nativeLayer.overrides(), ...hotspotOverrides};
          let dup = nativeLayer.copy();
          nativeLayer.parentGroup().addLayer(dup);
          dup = dup.detachByReplacingWithGroup();
          findHotspotsUnderSubtree_(dup, overrides);
          dup.removeFromParent();
        }
      });
    };

    findHotspotsUnderSubtree_(artboard.sketchObject, {});

    // store metadata
    prototypeData.artboards[artboard.id] = artboardData;
    return true;
  };

  while (processNextArtboard_());

  let htmlPath = `${rootPath}/index.html`;
  fs.writeFileSync(htmlPath, makeIndexHtml(context, prototypeData));
  NSWorkspace.sharedWorkspace().openFile(htmlPath);
  UI.message('✅ Exported!');
}


function doesSymbolInstanceHaveFlows(nativeSymbolInstance) {
  let hasFlows = false;
  // TODO: cache true/false for a given master
  walkLayerTree(nativeSymbolInstance.symbolMaster(), nativeLayer => {
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
  let template = fs.readFileSync(context.plugin.urlForResourceNamed('index_template.html').path(), {encoding: 'utf8'});
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
