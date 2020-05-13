#!/usr/bin/env bash

node fa-parse.js

sed -i '' 's/^/  /' icons
sed -i '' 's/^/  /' brands
sed -i '' 's/^/  /' meta

cat > icons.ts <<EOF
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

export const iconsMap: Record<string, string> = {
EOF

cat icons >> icons.ts

cat >> icons.ts <<EOF
};

export const icons: string[] = Object.keys(iconsMap);

export const solid: string[] = icons.map(icon => \`fas \${icon}\`);

export const regular: string[] = icons.map(icon => \`far \${icon}\`);

export const light: string[] = icons.map(icon => \`fal \${icon}\`);

export const brandMap: Record<string, string> = {
EOF

cat brands >> icons.ts

cat >> icons.ts <<EOF
};

export const brand = Object.keys(brandMap).map(icon => \`fab \${icon}\`);;

export const iconsMeta = new Map<string, string[]>([
EOF

cat meta >> icons.ts

cat >> icons.ts <<EOF
]);

export function getPureIconName(icon: string): string {
  return icon.substring(icon.indexOf('-') + 1);
}

export function searchIconsByMeta(meta: string): string[] {
  const result = [];
  iconsMeta.forEach((iconMeta, key) => {
    if (key.indexOf(meta) >= 0) {
      iconMeta.forEach(icon => {
        if (result.indexOf(icon) < 0) {
          result.push(icon);
        }
      });
    }
  });

  return result;
}

export function safeGetRandomIcon(): string {
  const unsafe = [
    'fa-coffin',
    'fa-book-dead',
    'fa-skull-crossbones',
    'fa-tombstone',
    'fa-tombstone-alt',
    'fa-flask-poison',
    'fa-hockey-mask',
    'fa-genderless',
    'fa-mars-double',
    'fa-mars-stroke',
    'fa-mars-stroke-h',
    'fa-mars-stroke-v',
    'fa-transgender',
    'fa-transgender-alt',
    'fa-venus-double',
    'fa-angry',
    'fa-frown',
    'fa-frown-open',
    'fa-sad-tear',
    'fa-sed-cry',
    'fa-tired',
    'fa-poo',
    'fa-om',
    'fa-quran',
  ];
  let icon: string;
  do {
    icon = icons[Math.round(Math.random() * icons.length)];
  } while (unsafe.indexOf(icon) > -1);

  return 'fas ' + icon;
}
EOF
