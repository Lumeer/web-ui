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

import * as Coordinates from 'coordinate-parser';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import {Collection} from '../../../../../core/store/collections/collection';
import {MapConfig, MapCoordinates, MapMarkerProperties} from '../../../../../core/store/maps/map.model';
import {shadeColor} from '../../../../../shared/utils/html-modifier';

export function parseCoordinates(value: string): MapCoordinates {
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

export function createMapboxMap(elementId: string, config: MapConfig) {
  return new mapboxgl.Map({
    container: elementId,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: config.center,
    zoom: config.zoom,
  });
}

export function createMapMarker(properties: MapMarkerProperties): any {
  const defaultAttributeValue = properties.document.data[properties.collection.defaultAttributeId] || '';

  const popup = new mapboxgl.Popup({
    anchor: 'top',
    closeButton: false,
    closeOnClick: false,
  }).setHTML(`<span class="text-default-attribute">${defaultAttributeValue}</span>`);

  const element = createMapMarkerIcon(properties.collection);
  const marker = new mapboxgl.Marker({element}).setLngLat(properties.coordinates).setPopup(popup);

  element.addEventListener('mouseenter', () => {
    if (!popup.isOpen()) {
      marker.togglePopup();
    }
  });
  element.addEventListener('mouseleave', () => {
    if (popup.isOpen()) {
      marker.togglePopup();
    }
  });

  return marker;
}

function createMapMarkerIcon(collection: Collection): HTMLDivElement {
  const markerElement = document.createElement('div');
  markerElement.className = 'map-marker';

  const shapeElement = document.createElement('div');
  shapeElement.className = 'map-marker-shape';
  shapeElement.style.borderColor = collection.color;

  const circleElement = document.createElement('div');
  circleElement.className = 'map-marker-icon';
  circleElement.style.backgroundColor = shadeColor(collection.color, -0.3);

  const iconElement = document.createElement('i');
  iconElement.className = collection.icon;

  circleElement.appendChild(iconElement);
  shapeElement.appendChild(circleElement);
  markerElement.appendChild(shapeElement);

  return markerElement;
}
