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
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {AddressConstraint} from '../../../../core/model/constraint/address.constraint';
import {CoordinatesConstraint} from '../../../../core/model/constraint/coordinates.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {CoordinatesConstraintConfig} from '../../../../core/model/data/constraint-config';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {GeoLocation} from '../../../../core/store/geocoding/geo-location';
import {GeocodingAction} from '../../../../core/store/geocoding/geocoding.action';
import {selectGeocodingQueryCoordinates} from '../../../../core/store/geocoding/geocoding.state';
import {
  MapAttributeType,
  MapConfig,
  MapCoordinates,
  MapMarkerData,
  MapMarkerProperties,
  MapModel,
  MapPosition,
} from '../../../../core/store/maps/map.model';
import {MapsAction} from '../../../../core/store/maps/maps.action';
import {areMapMarkerListsEqual, createMarkerPropertyFromData, populateCoordinateProperties} from './map-content.utils';
import {MapRenderComponent} from './render/map-render.component';
import {MarkerMoveEvent} from './render/marker-move.event';
import {ADDRESS_DEFAULT_FIELDS} from '../../../../shared/modal/attribute-type/form/constraint-config/address/address-constraint.constants';
import {ModalService} from '../../../../shared/modal/modal.service';
import {AttributesResource, AttributesResourceType} from '../../../../core/model/resource';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../core/store/link-instances/link-instances.action';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {MapDataConverter} from './map-data-converter';
import {checkOrTransformMapConfig} from '../../../../core/store/maps/map-config.utils';
import {deepArrayEquals} from '../../../../shared/utils/array.utils';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  linkTypes: LinkType[];
  linkInstances: LinkInstance[];
  config: MapConfig;
  permissions: Record<string, AllowedPermissions>;
  query: Query;
  constraintData: ConstraintData;
}

@Component({
  selector: 'map-content',
  templateUrl: './map-content.component.html',
  styleUrls: ['./map-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  @Input()
  public map: MapModel;

  @ViewChild(MapRenderComponent)
  public mapRenderComponent: MapRenderComponent;

  public loading$ = new BehaviorSubject(true);

  public markers$: Observable<MapMarkerProperties[]>;

  private refreshMarkers$ = new BehaviorSubject(Date.now());
  private dataSubject$ = new BehaviorSubject<Data>(null);

  private propertiesSubscription = new Subscription();
  private readonly converter = new MapDataConverter();

  constructor(
    private i18n: I18n,
    private notificationService: NotificationService,
    private store$: Store<{}>,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    const allProperties$ = this.subscribeToData$();
    this.markers$ = this.bindMarkers(allProperties$);

    this.propertiesSubscription.unsubscribe();
    this.propertiesSubscription = this.subscribeToUninitializedProperties(allProperties$);
  }

  private subscribeToData$(): Observable<MapMarkerData[]> {
    return this.dataSubject$.pipe(
      filter(data => !!data),
      debounceTime(100),
      map(data => this.handleData(data))
    );
  }

  private handleData(data: Data): MapMarkerData[] {
    const config = checkOrTransformMapConfig(data.config, data.query, data.collections, data.linkTypes);
    if (!deepObjectsEquals(config, data.config)) {
      this.store$.dispatch(new MapsAction.SetConfig({mapId: this.map.id, config}));
    }

    return this.converter.convert(
      config,
      data.collections,
      data.documents,
      data.linkTypes,
      data.linkInstances,
      data.permissions,
      data.constraintData,
      data.query
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.documents ||
        changes.collections ||
        changes.linkTypes ||
        changes.linkInstances ||
        changes.permissions ||
        changes.query ||
        changes.constraintData ||
        this.mapConfigChanged(changes.map)) &&
      this.map?.config
    ) {
      this.dataSubject$.next({
        documents: this.documents,
        linkInstances: this.linkInstances,
        linkTypes: this.linkTypes,
        collections: this.collections,
        permissions: this.permissions,
        config: this.map.config,
        query: this.query,
        constraintData: this.constraintData,
      });
    }
  }

  private mapConfigChanged(change: SimpleChange): boolean {
    if (!change) {
      return false;
    }
    if (!change.previousValue) {
      return true;
    }

    const previousStems = change.previousValue.config?.stemsConfigs;
    const currentStems = change.currentValue?.config?.stemsConfigs;

    return !deepArrayEquals(previousStems, currentStems);
  }

  public ngOnDestroy() {
    this.propertiesSubscription.unsubscribe();
  }

  private bindMarkers(allProperties$: Observable<MapMarkerData[]>): Observable<MapMarkerProperties[]> {
    return allProperties$.pipe(
      switchMap(allProperties => {
        const {coordinateProperties, otherProperties} = populateCoordinateProperties(
          allProperties,
          this.constraintData
        );
        return this.populateAddressProperties(otherProperties).pipe(
          map(addressProperties => coordinateProperties.concat(addressProperties))
        );
      }),
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

  private subscribeToUninitializedProperties(allProperties$: Observable<MapMarkerData[]>): Subscription {
    return allProperties$
      .pipe(map(allProperties => populateCoordinateProperties(allProperties, this.constraintData).otherProperties))
      .subscribe(uninitializedProperties => this.getCoordinates(uninitializedProperties));
  }

  private getCoordinates(propertiesList: MapMarkerData[]) {
    const addresses = propertiesList.map(properties => properties.dataResource.data[properties.attributeId]);
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

  public onMapMove(position: MapPosition) {
    this.store$.dispatch(new MapsAction.ChangePosition({mapId: this.map.id, position}));
  }

  public onMarkerMove(event: MarkerMoveEvent) {
    const attribute = this.findResourceByProperty(event.properties)?.attributes.find(
      attr => attr.id === event.properties.attributeId
    );
    const constraintType = attribute?.constraint?.type;

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

    const attribute = this.findResourceByProperty(properties)?.attributes.find(
      attr => attr.id === properties.attributeId
    );
    const value = (attribute?.constraint || new AddressConstraint({fields: ADDRESS_DEFAULT_FIELDS}))
      .createDataValue(location.address)
      .serialize();
    this.store$.dispatch(new GeocodingAction.GetCoordinatesSuccess({coordinatesMap: {[value]: location.coordinates}}));
    this.saveAttributeValue(properties, value);
  }

  private findResourceByProperty(property: MapMarkerProperties): AttributesResource {
    if (property.resourceType === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === property.resourceId);
    } else if (property.resourceType === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(linkType => linkType.id === property.resourceId);
    }
    return null;
  }

  private onGetLocationFailure(error: any) {
    this.notificationService.error(
      this.i18n({id: 'map.content.location.error', value: 'I could not save the new location.'})
    );

    // revert moved marker position
    this.refreshMarkers$.next(Date.now());
  }

  private saveCoordinatesAttribute(properties: MapMarkerProperties, coordinates: MapCoordinates) {
    const value = new CoordinatesConstraint({} as CoordinatesConstraintConfig).createDataValue(coordinates).serialize();
    this.saveAttributeValue(properties, value);
  }

  private saveAttributeValue(properties: MapMarkerProperties, value: string) {
    if (properties.resourceType === AttributesResourceType.Collection) {
      this.store$.dispatch(
        new DocumentsAction.PatchData({
          document: {
            collectionId: properties.resourceId,
            id: properties.dataResourceId,
            data: {[properties.attributeId]: value},
          },
        })
      );
    } else if (properties.resourceType === AttributesResourceType.LinkType) {
      this.store$.dispatch(
        new LinkInstancesAction.PatchData({
          linkInstance: {
            linkTypeId: properties.resourceId,
            id: properties.dataResourceId,
            documentIds: [null, null],
            data: {[properties.attributeId]: value},
          },
        })
      );
    }
  }

  public refreshMapSize() {
    if (this.mapRenderComponent) {
      this.mapRenderComponent.refreshMapSize();
    }
  }

  public onMarkerDetail(properties: MapMarkerProperties) {
    if (properties.resourceType === AttributesResourceType.Collection) {
      this.modalService.showDocumentDetail(properties.dataResourceId);
    } else if (properties.resourceType === AttributesResourceType.LinkType) {
      this.modalService.showLinkInstanceDetail(properties.dataResourceId);
    }
  }
}
