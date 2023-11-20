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
import {ConstraintData, UnknownConstraint, parseCoordinates} from '@lumeer/data-filters';
import {deepObjectsEquals} from '@lumeer/utils';

import {DataResource} from '../../../../core/model/resource';
import {Attribute} from '../../../../core/store/collections/collection';
import {findAttribute, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {
  MapAttributeType,
  MapCoordinates,
  MapMarkerData,
  MapMarkerProperties,
} from '../../../../core/store/maps/map.model';

export function populateCoordinateProperties(
  propertiesList: MapMarkerData[],
  constraintData: ConstraintData
): {coordinateProperties: MapMarkerProperties[]; otherProperties: MapMarkerData[]} {
  return propertiesList.reduce(
    (obj, properties) => {
      const value = properties.dataResource.data[properties.attributeId];
      const coordinates = parseCoordinates(value);
      if (coordinates) {
        const coordinateProperties = createMarkerPropertyFromData(
          properties,
          coordinates,
          MapAttributeType.Coordinates,
          constraintData
        );
        obj.coordinateProperties.push(coordinateProperties);
      } else {
        obj.otherProperties.push(properties);
      }
      return obj;
    },
    {coordinateProperties: [], otherProperties: []}
  );
}

export function createMarkerPropertyFromData(
  data: MapMarkerData,
  coordinates: MapCoordinates,
  attributeType: MapAttributeType,
  constraintData: ConstraintData
): MapMarkerProperties {
  const defaultAttributeId = getDefaultAttributeId(data.resource);

  const displayValue = formatValue(
    data.dataResource,
    findAttribute(data.resource.attributes, defaultAttributeId),
    constraintData
  );
  const positionValue = formatValue(
    data.dataResource,
    findAttribute(data.resource.attributes, data.attributeId),
    constraintData
  );

  return {
    id: mapMarkerDataId(data),
    resourceId: data.resource.id,
    resourceType: data.resourceType,
    dataResourceId: data.dataResource.id,
    color: data.color,
    icons: data.icons,
    attributeId: data.attributeId,
    editable: data.editable,
    attributeType,
    coordinates,
    displayValue,
    positionValue,
  };
}

export function areMapMarkerListsEqual(
  previousMarkers: MapMarkerProperties[],
  nextMarkers: MapMarkerProperties[]
): boolean {
  if (!previousMarkers || previousMarkers.length !== nextMarkers.length) {
    return false;
  }

  const nextMarkersMap = createMapMarkersMap(nextMarkers);

  return !previousMarkers.some(marker => isMapMarkerChanged(marker, nextMarkersMap[marker.id]));
}

function coordinatesAreSame(first: MapCoordinates, second: MapCoordinates): boolean {
  if (!first || !second) {
    return false;
  }

  const numDecimals = String(first.lat).split('.')?.[1]?.length || 0;
  return (
    first.lat.toFixed(numDecimals) === second.lat.toFixed(numDecimals) &&
    first.lng.toFixed(numDecimals) === second.lng.toFixed(numDecimals)
  );
}

export function createMapMarkersMap(markers: MapMarkerProperties[]): Record<string, MapMarkerProperties> {
  return markers.reduce((markersMap, marker) => {
    markersMap[marker.id] = {...marker};
    return markersMap;
  }, {});
}

export function mapMarkerDataId(data: MapMarkerData): string {
  if (!data.dataResource) {
    return null;
  }
  return `${data.resourceType}:${data.dataResource.id}:${data.attributeId}`;
}

function isMapMarkerChanged(previousMarker: MapMarkerProperties, nextMarker: MapMarkerProperties): boolean {
  if (previousMarker === nextMarker) {
    return false;
  }

  if (Boolean(previousMarker) !== Boolean(nextMarker)) {
    return true;
  }

  if (!coordinatesAreSame(previousMarker?.coordinates, nextMarker?.coordinates)) {
    return true;
  }

  return !deepObjectsEquals(previousMarker, nextMarker);
}

function formatValue(dataResource: DataResource, attribute: Attribute, constraintData: ConstraintData): string {
  if (!dataResource || !attribute) {
    return '';
  }
  const value = dataResource.data[attribute.id];
  return (attribute.constraint || new UnknownConstraint()).createDataValue(value, constraintData).preview();
}
