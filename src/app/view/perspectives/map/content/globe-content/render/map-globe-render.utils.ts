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

import {Feature, FeatureCollection, Point} from 'geojson';
import {AnyLayer, GeoJSONSourceRaw, LngLat, LngLatBounds, Map, MapboxOptions, Marker, Popup} from 'mapbox-gl';
import {MapMarkerProperties, MapPosition} from '../../../../../../core/store/maps/map.model';
import {shadeColor} from '../../../../../../shared/utils/html-modifier';
import {MapStyle, mapStyleUrls} from './map-style';
import {Configuration} from '../../../../../../../environments/configuration-type';

export function createMapboxMap(
  elementId: string,
  position: MapPosition,
  configuration: Configuration,
  locale: Record<string, string>
): Map {
  const positionOptions: Partial<MapboxOptions> = position?.center
    ? {
        bearing: position.bearing,
        center: position.center,
        pitch: position.pitch,
        zoom: position.zoom,
      }
    : {};

  return new Map({
    container: elementId,
    style: mapStyleUrls(MapStyle.MapTilerStreets, configuration.mapTilerKey),
    minZoom: 1,
    maxZoom: 20,
    locale,
    ...positionOptions,
  });
}

export function createMapMarkersGeoJson(markers: MapMarkerProperties[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map(properties => createMapMarkerFeature(properties)),
  };
}

function createMapMarkerFeature(properties: MapMarkerProperties): Feature<Point, MapMarkerProperties> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [properties.coordinates.lng, properties.coordinates.lat],
    },
    properties,
  };
}

export function createMapClusterMarkersSource(markers: MapMarkerProperties[]): GeoJSONSourceRaw {
  return {
    type: 'geojson',
    data: createMapMarkersGeoJson(markers),
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 25,
  };
}

export function createMapClustersLayer(id: string, source: string): AnyLayer {
  return {
    id,
    type: 'circle',
    source,
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': ['step', ['get', 'point_count'], '#95a5a6', 100, '#f1f075', 750, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    },
  };
}

export function createMapClusterCountsLayer(id: string, source: string): AnyLayer {
  return {
    id,
    type: 'symbol',
    source,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['LatoWeb', 'Arial'],
      'text-size': 12,
    },
  };
}

export function createMapMarker(properties: MapMarkerProperties, onDoubleClick: () => void): Marker {
  const popup = createMapMarkerPopup(properties);
  const element = createMapMarkerIcon(properties);

  const marker = new Marker({element, draggable: properties.editable})
    .setLngLat(properties.coordinates)
    .setPopup(popup);

  element.addEventListener('mouseenter', () => !popup.isOpen() && marker.togglePopup());
  element.addEventListener('mouseleave', () => popup.isOpen() && marker.togglePopup());
  element.addEventListener('dblclick', event => {
    event.preventDefault();
    event.stopPropagation();
    onDoubleClick();
  });

  return marker;
}

function createMapMarkerPopup(properties: MapMarkerProperties): Popup {
  const html = properties.displayValue
    ? `<div style="max-height: 14rem; line-height: 1.4rem; overflow: hidden">${properties.displayValue}</div>${properties.positionValue}`
    : properties.positionValue;

  return new Popup({
    anchor: 'top',
    closeButton: false,
    closeOnClick: false,
  }).setHTML(html);
}

function createMapMarkerIcon(properties: MapMarkerProperties): HTMLDivElement {
  const markerElement = document.createElement('div');
  markerElement.className = 'map-marker';
  if (properties.editable) {
    markerElement.classList.add('map-marker-editable');
  }

  const shapeElement = document.createElement('div');
  shapeElement.className = 'map-marker-shape';
  shapeElement.style.borderColor = properties.color;

  const circleElement = document.createElement('div');
  circleElement.style.backgroundColor = shadeColor(properties.color, -0.3);
  if (properties.icons.length === 1) {
    circleElement.className = 'map-marker-icon';

    const iconElement = document.createElement('i');
    iconElement.className = properties.icons[0];
    circleElement.appendChild(iconElement);
  } else {
    circleElement.className = 'map-marker-icons';

    const icon1Element = document.createElement('i');
    icon1Element.className = properties.icons[0];
    circleElement.appendChild(icon1Element);

    const icon2Element = document.createElement('i');
    icon2Element.className = properties.icons[1];
    circleElement.appendChild(icon2Element);
  }

  shapeElement.appendChild(circleElement);
  markerElement.appendChild(shapeElement);

  return markerElement;
}

export function createMapMarkersBounds(markers: MapMarkerProperties[]) {
  const bounds = new LngLatBounds();
  markers.forEach(marker => bounds.extend(new LngLat(marker.coordinates.lng, marker.coordinates.lat)));
  return bounds;
}
