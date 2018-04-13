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

import MochaJSDelegate from 'mocha-js-delegate';
import * as NibUI from 'sketch-nibui';

import * as Delegate from './lib/delegate';

import * as prefs from './prefs';


export default function(context) {
  let nib = NibUI.load(context, 'Prefs');
  let window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer(
      NSMakeRect(0, 0, nib.rootView.frame().size.width, nib.rootView.frame().size.height),
      NSTitledWindowMask | NSClosableWindowMask | NSWindowStyleMaskFullSizeContentView,
      NSBackingStoreBuffered,
      false);
  window.setDelegate(new MochaJSDelegate({
    'windowWillClose:': () => NSApp.stopModal()
  }).getClassInstance());
  window.setContentView(nib.rootView);
  window.setAutorecalculatesKeyViewLoop(true);

  nib.views.saveButton.setKeyEquivalent('\r');
  nib.views.icon.setImage(
      NSImage.alloc().initWithContentsOfFile(
          context.plugin.urlForResourceNamed('icon.png').path()));

  let controllers = [
    new PopUpButtonFieldController(context, {
      view: nib.views.exportScaleField,
      prefKey: 'exportScale',
      options: prefs.EXPORT_SCALES,
    }),
    // new PopUpButtonFieldController(context, {
    //   view: nib.views.layoutField,
    //   prefKey: 'layout',
    //   options: prefs.LAYOUTS,
    // }),
    new CheckboxFieldController(context, {
      view: nib.views.showHotspotsCheckbox,
      prefKey: 'showHotspots',
    }),
  ];

  controllers.forEach(c => c.load());

  let modalDelegate = new MochaJSDelegate({
    'close:': () => {
      NSApp.stopModal();
      window.orderOut(null);
    }
  }).getClassInstance();

  NSApp.beginSheet_modalForWindow_modalDelegate_didEndSelector_contextInfo_(
      window,
      context.document.documentWindow(),
      modalDelegate,
      NSSelectorFromString('close:'),
      null);

  let returnValue = null;

  Delegate.setTargetAndAction(nib.views.setDefaultsButton, () => {
    controllers.forEach(c => c.setAsDefault());
  });

  Delegate.setTargetAndAction(nib.views.cancelButton, () => NSApp.endSheet(window));
  Delegate.setTargetAndAction(nib.views.saveButton, () => {
    controllers.forEach(c => c.save());

    NSApp.endSheet(window);
  });

  NSApp.runModalForWindow(window); // blocks
}


class PopUpButtonFieldController {
  constructor(context, {view, prefKey, options}) {
    this.view = view;
    this.context = context;
    this.prefKey = prefKey;
    this.options = options;
  }

  load() {
    this.refresh_();
  }

  refresh_() {
    this.view.removeAllItems();
    let currentValue = prefs.resolveDocumentPrefs(context, context.document)[this.prefKey];
    let defaultValue = prefs.getUserOrDefaultPrefs(context)[this.prefKey];
    this.options.forEach(({value, label}) => {
      let def = (value == defaultValue) ? ' (default)' : '';
      this.view.addItemWithTitle(`${label}${def}`);
    });
    let indexOfCurrent = this.options.findIndex(({value}) => value == currentValue);
    if (indexOfCurrent >= 0) {
      this.view.selectItemAtIndex(indexOfCurrent);
    }
  }

  save() {
    let selectedIndex = this.view.indexOfSelectedItem();
    let value = this.options[selectedIndex].value;
    let defaultValue = prefs.getUserOrDefaultPrefs(context)[this.prefKey];
    if (value == defaultValue) {
      value = null;
    }

    let updateDict = {};
    updateDict[this.prefKey] = value;
    prefs.updateDocumentPrefs(context, context.document, updateDict);
  }

  setAsDefault() {
    let selectedIndex = this.view.indexOfSelectedItem();
    let value = this.options[selectedIndex].value;
    let updateDict = {};
    updateDict[this.prefKey] = value;
    prefs.updateUserPrefs(context, updateDict);
    this.refresh_();
    this.view.selectItemAtIndex(selectedIndex);
  }
}


class CheckboxFieldController {
  constructor(context, {view, prefKey}) {
    this.view = view;
    this.context = context;
    this.prefKey = prefKey;
  }

  load() {
    let currentValue = !!prefs.resolveDocumentPrefs(context, context.document)[this.prefKey];
    this.view.setState(currentValue ? NSControlStateValueOn : NSControlStateValueOff);
  }

  save() {
    let value = (this.view.state() == NSControlStateValueOn);
    let updateDict = {};
    updateDict[this.prefKey] = value;
    prefs.updateDocumentPrefs(context, context.document, updateDict);
  }

  setAsDefault() {
    let value = (this.view.state() == NSControlStateValueOn);
    let updateDict = {};
    updateDict[this.prefKey] = value;
    prefs.updateUserPrefs(context, updateDict);
  }
}
