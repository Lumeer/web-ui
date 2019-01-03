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

import * as Coordinates from 'coordinate-parser';
import {DivIcon, divIcon, LatLngLiteral, Map, MapOptions, marker, Marker} from 'leaflet';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {MapConfig, MapMarkerProperties} from '../../../../../core/store/maps/map.model';
import {shadeColor} from '../../../../../shared/utils/html-modifier';

const MAP_OPTIONS: MapOptions = {
  attributionControl: false,
};

export function parseCoordinates(value: string): LatLngLiteral {
  try {
    const coordinates = new Coordinates(value);
    return {
      lat: coordinates.getLatitude(),
      lng: coordinates.getLongitude(),
    };
  } catch (error) {
    return null;
  }
}

export function createLeafletMap(elementId: string, config: MapConfig) {
  return new Map(elementId, {
    ...MAP_OPTIONS,
    center: config.center,
    zoom: config.zoom,
  });
}

export function createMapMarker(properties: MapMarkerProperties): Marker {
  const defaultAttributeValue = properties.document.data[properties.collection.defaultAttributeId] || '';

  // TODO create GeoJSON instead and put properties into it
  return marker(properties.coordinates, {
    icon: createMapMarkerIcon(properties.collection),
  }).bindTooltip(`<b>${defaultAttributeValue}</b>`, {direction: 'bottom'});
}

function createMapMarkerIcon(collection: CollectionModel): DivIcon {
  return divIcon({
    className: 'map-marker',
    iconSize: null,
    html: `<div class="map-marker-shape" style="border-color: ${collection.color}">
             <div class="map-marker-icon" style="background-color: ${shadeColor(collection.color, -0.3)}">
               <i class="${collection.icon}"></i>
             </div>
           </div>`,
  });
}
