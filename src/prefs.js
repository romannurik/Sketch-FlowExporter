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

import * as pluginUserPrefs from './lib/plugin-user-prefs';


const PREFS_KEY = 'export_options';


export const EXPORT_SCALES = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
];


// export const LAYOUTS = [
//   { value: 'simple', label: 'Simple' },
//   { value: 'centered', label: 'Centered' },
// ];


const DEFAULTS = {
  exportScale: 1,
  // layout: 'simple',
  showHotspots: true,
  preventBodyScrolling: false,
};


export function resolveDocumentPrefs(context, document) {
  return Object.assign(
      getUserOrDefaultPrefs(context),
      getDocumentPrefs(context, document));
}


export function getDefaultPrefs() {
  return Object.assign({}, DEFAULTS);
}


export function getUserOrDefaultPrefs(context) {
  return Object.assign(
      getDefaultPrefs(),
      getUserPrefs(context));
}


export function getUserPrefs(context) {
  return pluginUserPrefs.get(context, PREFS_KEY, {});
}


export function updateUserPrefs(context, prefs) {
  prefs = Object.assign(
      getUserPrefs(context),
      prefs);
  for (var k in prefs) {
    if (prefs[k] === null) {
      delete prefs[k];
    }
  }
  setUserPrefs(context, prefs);
}


export function setUserPrefs(context, prefs) {
  pluginUserPrefs.set(context, PREFS_KEY, prefs);
}


export function getDocumentPrefs(context, document) {
  let v = context.command.valueForKey_onDocument_(PREFS_KEY, document.documentData()) || {};
  // convert v to a more pure JS object by serializing to JSON in Cocoa
  let jsonData = NSJSONSerialization.dataWithJSONObject_options_error_(v, 0, null);
  let jsonString = NSString.alloc().initWithData_encoding_(jsonData, NSUTF8StringEncoding);
  return JSON.parse(jsonString) || {};
}


export function updateDocumentPrefs(context, document, prefs) {
  prefs = Object.assign(
      getDocumentPrefs(context, document),
      prefs);
  for (var k in prefs) {
    if (prefs[k] === null) {
      delete prefs[k];
    }
  }
  setDocumentPrefs(context, document, prefs);
}


export function setDocumentPrefs(context, document, prefs) {
  context.command.setValue_forKey_onDocument_(prefs, PREFS_KEY, document.documentData());
}
