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

import {LatLngLiteral} from 'leaflet';
import {CollectionModel} from '../collections/collection.model';
import {DocumentModel} from '../documents/document.model';
import {MapTiles} from './map-tiles';

export interface MapModel {

  id: string;
  config: MapConfig;

}

export interface MapConfig {

  attributeIdsMap: AttributeIdsMap;
  center: LatLngLiteral;
  tiles: MapTiles;
  zoom: number;

}

export type AttributeIdsMap = { [collectionId: string]: string[] };

export const DEFAULT_MAP_CONFIG: MapConfig = {
  attributeIdsMap: {},
  center: {
    lat: 49.2331315,
    lng: 16.5701833
  },
  tiles: MapTiles.SeznamBasic,
  zoom: 5
};

export interface MapMarkerProperties {

  collection: CollectionModel;
  document: DocumentModel;
  attributeId: string;
  attributeType?: MapAttributeType;
  coordinates?: LatLngLiteral;

}

export enum MapAttributeType {

  Address = 'Address',
  Coordinates = 'Coordinates'

}
