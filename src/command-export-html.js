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

const sketch = require('sketch/dom');
const {Document, Page, Artboard, Rectangle, Flow, HotSpot} = sketch;
const UI = require('sketch/ui');

const dialog = require('@skpm/dialog');
const fs = require('@skpm/fs');
const path = require('@skpm/path');

import * as common from './lib/common';
import * as prefs from './prefs';


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
    // TODO: should we set the chosen one as the prototyping start point?
    // flowStartArtboard.flowStartPoint = true;
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
    exportArtboard(context, rootPath, artboard);

    // prepare metadata
    let artboardData = {
      title: artboard.name,
      width: artboard.frame.width,
      height: artboard.frame.height,
      hotspots: []
    };

    let findHotspotsUnderSubtree_ = (nativeParentGroup, hotspotOverrides) => {
      common.walkLayerTree(nativeParentGroup, (nativeLayer, setSublayers) => {
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

          if (target && nativeFlow.isValidFlowConnection()) {
            if (target !== String(Flow.BackTarget)) {
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

  ['jquery.min.js'].forEach(addlFile => {
    fs.copyFileSync(context.plugin.urlForResourceNamed(addlFile).path(), `${rootPath}/${addlFile}`);
  });

  NSWorkspace.sharedWorkspace().openFile(htmlPath);
  UI.message('✅ Exported!');
}


function exportArtboard(context, destPath, artboard) {
  // TODO: when sketch.export offers more control, switch to it
  // sketch.export(artboard, {
  //   formats: 'png',
  //   'use-id-for-name': true,
  //   overwriting: true,
  //   output: destPath,
  //   scales: String(prefs.resolveDocumentPrefs(context, context.document).exportScale),
  // });
  var ancestry = MSImmutableLayerAncestry.ancestryWithMSLayer_(artboard.sketchObject);
  var exportRequest = MSExportRequest.exportRequestsFromLayerAncestry_(ancestry).firstObject();
  exportRequest.format = 'png';
  exportRequest.scale = prefs.resolveDocumentPrefs(context, context.document).exportScale;
  context.document.saveArtboardOrSlice_toFile_(
      exportRequest,
      path.join(destPath, artboard.sketchObject.objectID() + '.png'));
}


function doesSymbolInstanceHaveFlows(nativeSymbolInstance) {
  let hasFlows = false;
  // TODO: cache true/false for a given master
  common.walkLayerTree(nativeSymbolInstance.symbolMaster(), nativeLayer => {
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
  let expanded = hydrate(template, {
    prototypeData,
    showHotspots: prefs.resolveDocumentPrefs(context, context.document).showHotspots,
  });
  return expanded;
}


function hydrate(template, context) {
  return template.replace(/<%=(.*)%>/g, (_, expr) => {
    let decls = Object.keys(context)
        .map(key => `var ${key} = ${JSON.stringify(context[key])};`)
        .join('');
    return Function(`"use strict";${decls};return ${expr};`)();
  });
}
