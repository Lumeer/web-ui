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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  MapAttributeType,
  MapConfig,
  MapCoordinates,
  MapMarkerData,
  MapMarkerProperties,
  MapPosition,
} from '../../../../../core/store/maps/map.model';
import {MarkerMoveEvent} from './render/marker-move.event';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectGeocodingQueryCoordinates} from '../../../../../core/store/geocoding/geocoding.state';
import {areMapMarkerListsEqual, createMarkerPropertyFromData, populateCoordinateProperties} from '../map-content.utils';
import {GeocodingAction} from '../../../../../core/store/geocoding/geocoding.action';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {GeoLocation} from '../../../../../core/store/geocoding/geo-location';
import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {NotificationService} from '../../../../../core/notifications/notification.service';
import {MapGlobeRenderComponent} from './render/map-globe-render.component';
import {
  AddressConstraint,
  ConstraintData,
  CoordinatesConstraint,
  CoordinatesConstraintConfig,
} from '@lumeer/data-filters';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {AppState} from '../../../../../core/store/app.state';
import {ConfigurationService} from '../../../../../configuration/configuration.service';
import {addressDefaultFields} from '../../../../../shared/modal/attribute/type/form/constraint-config/address/address-constraint.constants';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {findAttribute} from '../../../../../core/store/collections/collection.util';
import {Query} from '../../../../../core/store/navigation/query/query';
import {generateDocumentDataByResourceQuery} from '../../../../../core/store/documents/document.utils';
import {generateCorrelationId} from '../../../../../shared/utils/resource.utils';
import {View} from '../../../../../core/store/views/view';

@Component({
  selector: 'map-globe-content',
  templateUrl: './map-globe-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'w-100'},
})
export class MapGlobeContentComponent implements OnChanges {
  @Input()
  public config: MapConfig;

  @Input()
  public markerData: MapMarkerData[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Output()
  public mapMove = new EventEmitter<MapPosition>();

  @Output()
  public detail = new EventEmitter<MapMarkerProperties>();

  @Output()
  public valueSave = new EventEmitter<{properties: MapMarkerProperties; value: string}>();

  @ViewChild(MapGlobeRenderComponent)
  public mapGlobeRenderComponent: MapGlobeRenderComponent;

  public loading$ = new BehaviorSubject(true);

  public markers$: Observable<MapMarkerProperties[]>;

  private refreshMarkers$ = new BehaviorSubject(Date.now());

  constructor(
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private configurationService: ConfigurationService,
    private modalService: ModalService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.markerData || changes.constraintData) {
      this.markers$ = this.bindMarkers(this.markerData || []);
      this.checkUninitializedProperties(this.markerData || []);
    }
  }

  private bindMarkers(data: MapMarkerData[]): Observable<MapMarkerProperties[]> {
    const {coordinateProperties, otherProperties} = populateCoordinateProperties(data, this.constraintData);
    return this.populateAddressProperties(otherProperties).pipe(
      map(addressProperties => filterValidCoordinateProperties(coordinateProperties).concat(addressProperties)),
      distinctUntilChanged((previous, next) => areMapMarkerListsEqual(previous, next)),
      switchMap(properties => this.refreshMarkers$.pipe(map(() => [...properties])))
    );
  }

  private populateAddressProperties(propertiesList: MapMarkerData[]): Observable<MapMarkerProperties[]> {
    return this.store$.pipe(
      select(selectGeocodingQueryCoordinates),
      map(queryCoordinates =>
        propertiesList.reduce((addressPropertiesList, properties) => {
          const coordinates = queryCoordinates[properties.dataResource.data[properties.attributeId]];
          if (coordinates) {
            const addressProperties = createMarkerPropertyFromData(
              properties,
              coordinates,
              MapAttributeType.Address,
              this.constraintData
            );
            addressPropertiesList.push(addressProperties);
          }
          return addressPropertiesList;
        }, [])
      )
    );
  }

  private checkUninitializedProperties(data: MapMarkerData[]) {
    const {otherProperties} = populateCoordinateProperties(data, this.constraintData);
    this.getCoordinates(otherProperties);
  }

  private getCoordinates(propertiesList: MapMarkerData[]) {
    const addresses = propertiesList
      .map(properties => properties.dataResource.data?.[properties.attributeId])
      .filter(value => isNotNullOrUndefined(value) && String(value).trim().length > 0);
    if (addresses.length === 0) {
      this.loading$.next(false);
      return;
    }

    this.loading$.next(true);

    this.store$.dispatch(
      new GeocodingAction.GetCoordinates({
        queries: addresses,
        onSuccess: () => this.loading$.next(false),
        onFailure: () => this.loading$.next(false),
      })
    );
  }

  public onMarkerMove(event: MarkerMoveEvent) {
    if (event.properties.attributeType === MapAttributeType.Address) {
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

    const attribute = this.findResourceByProperty(properties.resourceType, properties.resourceId)?.attributes.find(
      attr => attr.id === properties.attributeId
    );
    const value = (
      attribute?.constraint ||
      new AddressConstraint({fields: addressDefaultFields(this.configurationService.getConfiguration())})
    )
      .createDataValue(location.address)
      .serialize();
    this.store$.dispatch(new GeocodingAction.GetCoordinatesSuccess({coordinatesMap: {[value]: location.coordinates}}));
    this.saveAttributeValue(properties, value);
  }

  private findResourceByProperty(type: AttributesResourceType, id: string): AttributesResource {
    if (type === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === id);
    } else if (type === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(linkType => linkType.id === id);
    }
    return null;
  }

  private onGetLocationFailure(error: any) {
    this.notificationService.error($localize`:@@map.content.location.error:I could not save the new location.`);

    // revert moved marker position
    this.refreshMarkers$.next(Date.now());
  }

  private saveCoordinatesAttribute(properties: MapMarkerProperties, coordinates: MapCoordinates) {
    const value = new CoordinatesConstraint({} as CoordinatesConstraintConfig).createDataValue(coordinates).serialize();
    this.saveAttributeValue(properties, value);
  }

  private saveAttributeValue(properties: MapMarkerProperties, value: string) {
    this.valueSave.emit({properties, value});
  }

  public refreshContent() {
    this.mapGlobeRenderComponent?.refreshMapSize();
  }

  public onNewMarker(coordinates: MapCoordinates) {
    const attributeConfig = this.config?.stemsConfigs?.find(stemConfig => stemConfig?.attributes?.length > 0)
      ?.attributes[0];
    const resource = this.findResourceByProperty(attributeConfig?.resourceType, attributeConfig?.resourceId);
    const attribute = findAttribute(resource?.attributes, attributeConfig.attributeId);
    if (resource && attribute) {
      const value = new CoordinatesConstraint({} as CoordinatesConstraintConfig)
        .createDataValue(coordinates)
        .serialize();
      this.createNewMarker(value, attribute, resource, attributeConfig.resourceType);
    }
  }

  private createNewMarker(
    value: any,
    attribute: Attribute,
    resource: AttributesResource,
    type: AttributesResourceType
  ) {
    const data = generateDocumentDataByResourceQuery(resource, this.query, this.constraintData);
    data[attribute.id] = value;

    const dataResource =
      type === AttributesResourceType.Collection
        ? {collectionId: resource.id, correlationId: generateCorrelationId(), data}
        : {linkTypeId: resource.id, correlationId: generateCorrelationId(), data, documentIds: []};
    this.modalService.showDataResourceDetail(dataResource, resource, this.view?.id);
  }
}

function filterValidCoordinateProperties(properties: MapMarkerProperties[]): MapMarkerProperties[] {
  return properties.filter(
    property => Math.abs(property.coordinates.lng) <= 180 && Math.abs(property.coordinates.lat) <= 90
  );
}
