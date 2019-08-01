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
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AttributeIdsMap, MapAttributeType, MapMarkerProperties} from '../../../../core/store/maps/map.model';
import {parseCoordinates} from '../../../../shared/utils/map/coordinates.utils';

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

export function createMarkerPropertiesList(
  documents: DocumentModel[],
  attributeIdsMap: AttributeIdsMap,
  collectionsMap: Record<string, Collection>,
  collectionPermissions: Record<string, AllowedPermissions>
): MapMarkerProperties[] {
  return documents.reduce((propertiesList, document) => {
    const attributeIds = attributeIdsMap[document.collectionId] || [];
    const attributeId = attributeIds.find(id => !!document.data[id]);
    const collection = collectionsMap[document.collectionId];
    const editable = collectionPermissions[document.collectionId].writeWithView;

    if (collection && attributeId) {
      propertiesList.push({collection, document, attributeId, editable});
    }
    return propertiesList;
  }, []);
}

export function populateCoordinateProperties(propertiesList: MapMarkerProperties[]): MapMarkerProperties[] {
  return propertiesList.reduce((coordinatePropertiesList, properties) => {
    const value = properties.document.data[properties.attributeId];
    const coordinates = parseCoordinates(value);
    if (coordinates) {
      const coordinateProperties: MapMarkerProperties = {
        ...properties,
        coordinates,
        attributeType: MapAttributeType.Coordinates,
      };
      coordinatePropertiesList.push(coordinateProperties);
    }
    return coordinatePropertiesList;
  }, []);
}

export function filterUninitializedProperties(
  allProperties: MapMarkerProperties[],
  coordinateProperties: MapMarkerProperties[]
): MapMarkerProperties[] {
  const documentIdsMap = new Set(coordinateProperties.map(properties => properties.document.id));
  return allProperties.filter(properties => !documentIdsMap.has(properties.document.id));
}

export function areMapMarkerListsEqual(
  previousMarkers: MapMarkerProperties[],
  nextMarkers: MapMarkerProperties[]
): boolean {
  if (!previousMarkers || previousMarkers.length !== nextMarkers.length) {
    return false;
  }

  const nextMarkersMap = createMapMarkersMap(nextMarkers);

  return !previousMarkers.some(marker => isMapMarkerChanged(marker, nextMarkersMap[marker.document.id]));
}

function createMapMarkersMap(markers: MapMarkerProperties[]): Record<string, MapMarkerProperties> {
  return markers.reduce((markersMap, marker) => {
    markersMap[marker.document.id] = marker;
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

  return (
    previousMarker.collection.color !== nextMarker.collection.color ||
    previousMarker.collection.id !== nextMarker.collection.id ||
    previousMarker.collection.icon !== nextMarker.collection.icon ||
    previousMarker.coordinates.lat !== nextMarker.coordinates.lat ||
    previousMarker.coordinates.lng !== nextMarker.coordinates.lng ||
    previousMarker.attributeId !== nextMarker.attributeId ||
    previousMarker.attributeType !== nextMarker.attributeType ||
    previousMarker.editable !== previousMarker.editable
  );
}
