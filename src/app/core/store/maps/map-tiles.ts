/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {tileLayer, TileLayer} from 'leaflet';
import {environment} from '../../../../environments/environment';

export enum MapTiles {

  OpenStreetMap = 'OpenStreetMap',
  SeznamBasic = 'SeznamBasic'

}

export const LUMEER_ATTRIBUTION = `<span class="lumeer-attribution">
<a href="https://www.lumeer.io" target="_blank">
<img src="assets/img/lumeer.svg">Lumeer
</a>
</span>`;

export function createMapTileLayer(tiles: MapTiles): TileLayer {
  switch (tiles) {
    case MapTiles.OpenStreetMap:
      return createOpenStreetMapTileLayer();
    case MapTiles.SeznamBasic:
      return createSeznamBasicMapTileLayer();
  }
}

function createOpenStreetMapTileLayer(): TileLayer {
  return tileLayer('//{s}.tile.osm.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution: LUMEER_ATTRIBUTION,
    detectRetina: true
  });
}

function createSeznamBasicMapTileLayer(): TileLayer {
  switch (environment.locale) {
    case 'cs':
      return createCzechSeznamBasicMapTileLayer();
    default:
      return createEnglishSeznamBasicMapTileLayer();
  }
}

function createCzechSeznamBasicMapTileLayer() {
  return tileLayer('https://m{s}.mapserver.mapy.cz/base-m/{z}-{x}-{y}', {
    attribution: LUMEER_ATTRIBUTION,
    detectRetina: true,
    maxZoom: 18,
    minZoom: 2,
    subdomains: '1234'
  });
}

function createEnglishSeznamBasicMapTileLayer() {
  return tileLayer('https://m{s}.mapserver.mapy.cz/base-en/{z}-{x}-{y}', {
    attribution: LUMEER_ATTRIBUTION,
    detectRetina: true,
    maxZoom: 18,
    minZoom: 2,
    subdomains: '1234'
  });
}
