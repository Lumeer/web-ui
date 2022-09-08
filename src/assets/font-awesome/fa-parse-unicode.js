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

console.log('*** FontAwesome icons.json parser to unicode ***\n');
console.log('1a) Copy icons.json version 5 to icons5.json in this directory');
console.log('1b) Copy icons.json version 6 to icons6.json in this directory');
console.log('2) Run: node fa-parse-unicode.js');
console.log('3) Read the unicode output file\n\nWorking...\n');

const fs = require('fs');
const loadJsonFile5 = require('./icons5.json');
const loadJsonFile6 = require('./icons6.json');

var unicodes = new Map();

function parseIcons(iconsFile) {
  Object.keys(iconsFile).forEach(function (key) {
    var icon = iconsFile[key];

    if (icon.styles.includes('brands')) {
      unicodes.set('fab fa-' + key, '\\u' + icon.unicode.padStart(4, '0'));
    } else {
      unicodes.set('fas fa-' + key, '\\u' + icon.unicode.padStart(4, '0'));
    }
  });
}

parseIcons(loadJsonFile5);
parseIcons(loadJsonFile6);

var unicodeIcons = '';

unicodes.forEach(function (value, key) {
  unicodeIcons += "['" + key + "', '" + value + "'],\n";
});

fs.writeFile('./unicode', unicodeIcons, function (err) {});

console.log('Successfully parsed!\n');
