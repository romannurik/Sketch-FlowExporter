const sketch = require('sketch/dom');
const {Document, Page, Artboard, Rectangle, Flow, HotSpot} = sketch;
const UI = require('sketch/ui');

const dialog = require('@skpm/dialog');
const fs = require('@skpm/fs');
const path = require('@skpm/path');


export default function(context) {
  let document = Document.getSelectedDocument();
  let page = document.selectedPage;

  let prototypeData = {
    title: null,
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

  if (!firstArtboard) {
    UI.message('❌ No artboards on the page');
    return;
  }

  // error out if not found
  if (!flowStartArtboard) {
    flowStartArtboard = firstArtboard;
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
      title: artboard.name,
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
