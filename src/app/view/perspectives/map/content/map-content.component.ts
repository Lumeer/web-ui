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

import {ChangeDetectionStrategy, Component, Input, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {ConstraintType} from '../../../../core/model/data/constraint';
import {AddressConstraintConfig} from '../../../../core/model/data/constraint-config';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Collection} from '../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';
import {selectDocumentsByQuery} from '../../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {GeoLocation} from '../../../../core/store/geocoding/geo-location';
import {GeocodingAction} from '../../../../core/store/geocoding/geocoding.action';
import {selectGeocodingQueryCoordinates} from '../../../../core/store/geocoding/geocoding.state';
import {
  MapAttributeType,
  MapCoordinates,
  MapMarkerProperties,
  MapModel,
  MapPosition,
} from '../../../../core/store/maps/map.model';
import {MapsAction} from '../../../../core/store/maps/maps.action';
import {selectMapConfigById} from '../../../../core/store/maps/maps.state';
import {CollectionsPermissionsPipe} from '../../../../shared/pipes/permissions/collections-permissions.pipe';
import {getAddressSaveValue, getCoordinatesSaveValue} from '../../../../shared/utils/data.utils';
import {
  areMapMarkerListsEqual,
  createMarkerPropertiesList,
  extractCollectionsFromDocuments,
  filterUninitializedProperties,
  populateCoordinateProperties,
} from './map-content.utils';
import {MapRenderComponent} from './render/map-render.component';
import {MarkerMoveEvent} from './render/marker-move.event';

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

  @ViewChild(MapRenderComponent, {static: false})
  public mapRenderComponent: MapRenderComponent;

  public markers$: Observable<MapMarkerProperties[]>;

  private refreshMarkers$ = new BehaviorSubject(Date.now());

  constructor(
    private collectionsPermissions: CollectionsPermissionsPipe,
    private i18n: I18n,
    private notificationService: NotificationService,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.bindMarkers();
  }

  private bindMarkers() {
    this.markers$ = combineLatest([
      this.store$.pipe(select(selectCollectionsDictionary)),
      this.store$.pipe(select(selectDocumentsByQuery)),
      this.store$.pipe(
        select(selectMapConfigById(this.map.id)),
        map(config => config.attributeIdsMap),
        distinctUntilChanged()
      ),
    ]).pipe(
      switchMap(([collectionsMap, documents, attributeIdsMap]) => {
        const collections = extractCollectionsFromDocuments(collectionsMap, documents);
        return this.collectionsPermissions.transform(collections).pipe(
          switchMap(permissions => {
            const allProperties = createMarkerPropertiesList(documents, attributeIdsMap, collectionsMap, permissions);
            const coordinateProperties = populateCoordinateProperties(allProperties);
            const uninitializedProperties = filterUninitializedProperties(allProperties, coordinateProperties);

            return this.populateAddressProperties(uninitializedProperties).pipe(
              map(addressProperties => coordinateProperties.concat(addressProperties))
            );
          })
        );
      }),
      distinctUntilChanged((previous, next) => areMapMarkerListsEqual(previous, next)),
      switchMap(properties => this.refreshMarkers$.pipe(map(() => [...properties])))
    );
  }

  private populateAddressProperties(propertiesList: MapMarkerProperties[]): Observable<MapMarkerProperties[]> {
    const addresses = propertiesList.map(properties => properties.document.data[properties.attributeId]);
    this.store$.dispatch(new GeocodingAction.GetCoordinates({queries: addresses}));
    return this.store$.pipe(
      select(selectGeocodingQueryCoordinates),
      map(queryCoordinates =>
        propertiesList.reduce((addressPropertiesList, properties) => {
          const coordinates = queryCoordinates[properties.document.data[properties.attributeId]];
          if (coordinates) {
            const addressProperties: MapMarkerProperties = {
              ...properties,
              coordinates,
              attributeType: MapAttributeType.Address,
            };
            addressPropertiesList.push(addressProperties);
          }
          return addressPropertiesList;
        }, [])
      )
    );
  }

  public onMapMove(position: MapPosition) {
    this.store$.dispatch(new MapsAction.ChangePosition({mapId: this.map.id, position}));
  }

  public onMarkerMove(event: MarkerMoveEvent) {
    const attribute = event.properties.collection.attributes.find(attr => attr.id === event.properties.attributeId);
    const constraintType = attribute && attribute.constraint && attribute.constraint.type;

    if (event.properties.attributeType === MapAttributeType.Address || constraintType === ConstraintType.Address) {
      this.saveAddressAttribute(event.properties, event.coordinates);
    } else {
      this.saveCoordinatesAttribute(event.properties, event.coordinates);
    }
  }

  private saveAddressAttribute(properties: MapMarkerProperties, coordinates: MapCoordinates) {
    this.store$.dispatch(
      new GeocodingAction.GetLocation({
        coordinates,
        onSuccess: location => this.onGetLocationSuccess(location, properties, coordinates),
        onFailure: error => this.onGetLocationFailure(error),
      })
    );
  }

  private onGetLocationSuccess(location: GeoLocation, properties: MapMarkerProperties, coordinates: MapCoordinates) {
    if (!location || !location.address || !location.address.street) {
      this.saveCoordinatesAttribute(properties, coordinates);
      return;
    }

    const attribute = properties.collection.attributes.find(attr => attr.id === properties.attributeId);
    const value = getAddressSaveValue(
      location.address,
      attribute.constraint && (attribute.constraint.config as AddressConstraintConfig)
    );
    this.store$.dispatch(new GeocodingAction.GetCoordinatesSuccess({coordinatesMap: {[value]: location.coordinates}}));
    this.saveAttributeValue(properties, value);
  }

  private onGetLocationFailure(error: any) {
    this.notificationService.error(
      this.i18n({id: 'map.content.location.error', value: 'I could not save the new location.'})
    );

    // revert moved marker position
    this.refreshMarkers$.next(Date.now());
  }

  private saveCoordinatesAttribute(properties: MapMarkerProperties, coordinates: MapCoordinates) {
    const value = getCoordinatesSaveValue(coordinates);
    this.saveAttributeValue(properties, value);
  }

  private saveAttributeValue(properties: MapMarkerProperties, value: string) {
    this.store$.dispatch(
      new DocumentsAction.PatchData({
        document: {
          collectionId: properties.collection.id,
          id: properties.document.id,
          data: {[properties.attributeId]: value},
        },
      })
    );
  }

  public refreshMapSize() {
    if (this.mapRenderComponent) {
      this.mapRenderComponent.refreshMapSize();
    }
  }
}
