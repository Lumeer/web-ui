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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Marker} from 'leaflet';
import {combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {GeocodingApiService} from '../../../../core/api/geocoding/geocoding-api.service';
import {Collection} from '../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';
import {selectDocumentsByQuery} from '../../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AttributeIdsMap, MapAttributeType, MapMarkerProperties, MapModel} from '../../../../core/store/maps/map.model';
import {selectMapConfigById} from '../../../../core/store/maps/maps.state';
import {createMapMarker, parseCoordinates} from './render/map.utils';

@Component({
  selector: 'map-content',
  templateUrl: './map-content.component.html',
  styleUrls: ['./map-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapContentComponent implements OnInit {
  @Input()
  public collections: Collection[] = [];

  @Input()
  public documents: DocumentModel[] = [];

  @Input()
  public map: MapModel;

  public markers$: Observable<Marker[]>;

  constructor(private geocodingApiService: GeocodingApiService, private store$: Store<{}>) {}

  public ngOnInit() {
    this.bindMarkers();
  }

  private bindMarkers() {
    this.markers$ = combineLatest(
      this.store$.pipe(select(selectCollectionsDictionary)),
      this.store$.pipe(select(selectDocumentsByQuery)),
      this.store$.pipe(
        select(selectMapConfigById(this.map.id)),
        map(config => config.attributeIdsMap),
        distinctUntilChanged()
      )
    ).pipe(
      switchMap(([collectionsMap, documents, attributeIdsMap]) => {
        const allProperties = createMarkerPropertiesList(documents, attributeIdsMap, collectionsMap);
        const coordinateProperties = populateCoordinateProperties(allProperties);
        const uninitializedProperties = filterUninitializedProperties(allProperties, coordinateProperties);

        return this.populateAddressProperties(uninitializedProperties).pipe(
          map(addressProperties => {
            return coordinateProperties.concat(addressProperties).map(properties => createMapMarker(properties));
          })
        );
      })
    );
  }

  private populateAddressProperties(propertiesList: MapMarkerProperties[]): Observable<MapMarkerProperties[]> {
    const addresses = propertiesList.map(properties => properties.document.data[properties.attributeId]);
    return this.geocodingApiService.convertAddressesToCoordinates(addresses).pipe(
      map(addressCoordinatesMap =>
        propertiesList.reduce((addressPropertiesList, properties) => {
          const coordinates = addressCoordinatesMap[properties.document.data[properties.attributeId]];
          if (coordinates) {
            const addressProperties: MapMarkerProperties = {
              ...properties,
              coordinates,
              attributeType: MapAttributeType.Address,
            };
            return addressPropertiesList.concat(addressProperties);
          }
          return addressPropertiesList;
        }, [])
      )
    );
  }
}

function createMarkerPropertiesList(
  documents: DocumentModel[],
  attributeIdsMap: AttributeIdsMap,
  collectionsMap: {[id: string]: Collection}
): MapMarkerProperties[] {
  return documents.reduce((propertiesList, document) => {
    const attributeIds = attributeIdsMap[document.collectionId] || [];
    const attributeId = attributeIds.find(id => !!document.data[id]);

    if (attributeId) {
      const properties: MapMarkerProperties = {
        collection: collectionsMap[document.collectionId],
        document,
        attributeId,
      };
      return propertiesList.concat(properties);
    }
    return propertiesList;
  }, []);
}

function populateCoordinateProperties(propertiesList: MapMarkerProperties[]): MapMarkerProperties[] {
  return propertiesList.reduce((coordinatePropertiesList, properties) => {
    const value = properties.document.data[properties.attributeId];
    const coordinates = parseCoordinates(value);
    if (coordinates) {
      const coordinateProperties: MapMarkerProperties = {
        ...properties,
        coordinates,
        attributeType: MapAttributeType.Coordinates,
      };
      return coordinatePropertiesList.concat(coordinateProperties);
    }
    return coordinatePropertiesList;
  }, []);
}

function filterUninitializedProperties(
  allProperties: MapMarkerProperties[],
  coordinateProperties: MapMarkerProperties[]
): MapMarkerProperties[] {
  const documentIdsMap = new Set(coordinateProperties.map(properties => properties.document.id));
  return allProperties.filter(properties => !documentIdsMap.has(properties.document.id));
}
