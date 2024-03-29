/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

console.log('*** FontAwesome icons.json parser ***\n');
console.log('1) Copy icons.json to this directory');
console.log('2) Run: node fa-parse.js');
console.log('3) Read brands, icons and meta output\n\nWorking...\n');

const fs = require('fs');
const loadJsonFile = require('./icons.json');

var icons = '';
var brands = '';
var first = true;
var first_brands = true;
var vocab = new Map();

function registerVocab(iconKey, term) {
  if (!vocab.has(term)) {
    vocab.set(term, []);
  }

  if (!vocab.get(term).includes(iconKey)) {
    vocab.get(term).push(iconKey);
  }
}

Object.keys(loadJsonFile).forEach(function (key) {
  var icon = loadJsonFile[key];

  if (icon.styles.includes('brands')) {
    if (!first_brands) {
      brands += ',\n';
    }
    first_brands = false;
    brands += "'fa-" + key + "':" + "'\\u" + icon.unicode.padStart(4, '0') + "'";
  } else {
    if (!first) {
      icons += ',\n';
    }
    first = false;
    icons += "'fa-" + key + "':" + "'\\u" + icon.unicode.padStart(4, '0') + "'";
  }

  registerVocab(String(key), String(key));

  if (icon.aliases && icon.aliases.names) {
    Object.keys(icon.aliases.names).forEach(function (value) {
      registerVocab(String(key), icon.aliases.names[value]);
    });
  }
});

fs.writeFile('./icons', icons, function (err) {});
fs.writeFile('./brands', brands, function (err) {});

var meta = '';
first = true;

vocab.forEach(function (value, key) {
  if (key) {
    if (!first) {
      meta += ',\n';
    }
    first = false;

    var line = '';
    first_brands = true;
    line += "['" + String(key).replace("'", "\\'") + "', [\n  ";
    value.forEach(function (elem) {
      if (!first_brands) {
        line += ',\n  ';
      }
      first_brands = false;
      line += "'" + elem.replace("'", "\\'") + "'";
    });
    line += '\n]]';

    meta += line;
  }
});

fs.writeFile('./meta', meta, function (err) {});

var unicodeIcons = '';

Object.keys(loadJsonFile).forEach(function (key) {
  var icon = loadJsonFile[key];

  if (icon.styles.includes('brands')) {
    unicodeIcons += "['fab fa-" + key + "', '\\u" + icon.unicode.padStart(4, '0') + "'],\n";
  } else {
    unicodeIcons += "['fas fa-" + key + "', '\\u" + icon.unicode.padStart(4, '0') + "'],\n";
  }
});

fs.writeFile('./unicode', unicodeIcons, function (err) {});

console.log('Successfully parsed!\n');
