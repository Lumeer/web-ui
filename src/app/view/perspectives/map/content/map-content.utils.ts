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

import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  AttributeIdsMap,
  MapAttributeType,
  MapCoordinates,
  MapMarkerData,
  MapMarkerProperties,
} from '../../../../core/store/maps/map.model';
import {parseCoordinates} from '../../../../shared/utils/map/coordinates.utils';
import {DataResource} from '../../../../core/model/resource';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';

export function extractCollectionsFromDocuments(
  collectionsMap: Record<string, Collection>,
  documents: DocumentModel[]
): Collection[] {
  return [
    ...documents.reduce((collectionIds, document) => {
      collectionIds.add(document.collectionId);
      return collectionIds;
    }, new Set<string>()),
  ].map(collectionId => collectionsMap[collectionId]);
}

export function createMarkerPropertiesData(
  documents: DocumentModel[],
  attributeIdsMap: AttributeIdsMap,
  collectionsMap: Record<string, Collection>,
  collectionPermissions: Record<string, AllowedPermissions>
): MapMarkerData[] {
  return documents.reduce<MapMarkerData[]>((propertiesList, document) => {
    const attributeIds = attributeIdsMap[document.collectionId] || [];
    for (const attributeId of attributeIds) {
      const collection = collectionsMap[document.collectionId];
      const editable = collectionPermissions[document.collectionId]?.writeWithView;

      if (collection && !!document.data[attributeId]) {
        propertiesList.push({resource: collection, dataResource: document, attributeId, editable});
      }
    }
    return propertiesList;
  }, []);
}

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
    resourceId: data.resource.id,
    resourceType: getAttributesResourceType(data.resource),
    dataResourceId: data.dataResource.id,
    color: (<Collection>data.resource).color,
    icon: (<Collection>data.resource).icon,
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

  return !previousMarkers.some(marker => isMapMarkerChanged(marker, nextMarkersMap[marker.dataResourceId]));
}

function createMapMarkersMap(markers: MapMarkerProperties[]): Record<string, MapMarkerProperties> {
  return markers.reduce((markersMap, marker) => {
    markersMap[marker.dataResourceId] = marker;
    return markersMap;
  }, {});
}

function isMapMarkerChanged(previousMarker: MapMarkerProperties, nextMarker: MapMarkerProperties): boolean {
  if (previousMarker === nextMarker) {
    return false;
  }

  if (Boolean(previousMarker) !== Boolean(nextMarker)) {
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
