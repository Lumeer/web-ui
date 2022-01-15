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
  OnInit,
  SimpleChange,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {
  MapConfig,
  MapCoordinates,
  MapMarkerData,
  MapMarkerProperties,
  MapPosition,
} from '../../../../core/store/maps/map.model';
import {MapsAction} from '../../../../core/store/maps/maps.action';
import {ModalService} from '../../../../shared/modal/modal.service';
import {AttributesResource, AttributesResourceType} from '../../../../core/model/resource';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {MapDataConverter} from './map-data-converter';
import {checkOrTransformMapConfig} from '../../../../core/store/maps/map-config.utils';
import {deepArrayEquals} from '../../../../shared/utils/array.utils';
import {MapGlobeContentComponent} from './globe-content/map-globe-content.component';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../../core/store/link-instances/link-instances.action';
import {
  ConstraintData,
  CoordinatesConstraint,
  CoordinatesConstraintConfig,
  DocumentsAndLinksData,
} from '@lumeer/data-filters';
import {AppState} from '../../../../core/store/app.state';
import {User} from '../../../../core/store/users/user';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {View} from '../../../../core/store/views/view';
import {generateDocumentDataByResourceQuery} from '../../../../core/store/documents/document.utils';
import {generateCorrelationId} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';

interface Data {
  collections: Collection[];
  linkTypes: LinkType[];
  data: DocumentsAndLinksData;
  config: MapConfig;
  permissions: ResourcesPermissions;
  query: Query;
  user: User;
  constraintData: ConstraintData;
}

@Component({
  selector: 'map-content',
  templateUrl: './map-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-grow-1 overflow-hidden'},
})
export class MapContentComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public query: Query;

  @Input()
  public user: User;

  @Input()
  public view: View;

  @Input()
  public config: MapConfig;

  @Input()
  public mapId: string;

  @ViewChild(MapGlobeContentComponent)
  public mapGlobeContentComponent: MapGlobeContentComponent;

  public data$: Observable<MapMarkerData[]>;

  private dataSubject$ = new BehaviorSubject<Data>(null);

  private readonly converter = new MapDataConverter();

  constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public ngOnInit() {
    this.data$ = this.subscribeToData$();
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
      this.store$.dispatch(new MapsAction.SetConfig({mapId: this.mapId, config}));
    }

    return this.converter.convert(
      config,
      data.collections,
      data.linkTypes,
      data.data,
      data.permissions,
      data.query,
      data.user,
      data.constraintData
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.collections ||
        changes.linkTypes ||
        changes.data ||
        changes.permissions ||
        changes.query ||
        changes.user ||
        changes.constraintData ||
        this.mapConfigChanged(changes.config)) &&
      this?.config
    ) {
      this.dataSubject$.next({
        collections: this.collections,
        linkTypes: this.linkTypes,
        data: this.data,
        permissions: this.permissions,
        config: this.config,
        query: this.query,
        user: this.user,
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

    const previousStems = change.previousValue?.stemsConfigs;
    const currentStems = change.currentValue?.stemsConfigs;

    return !deepArrayEquals(previousStems, currentStems);
  }

  public onMapMove(position: MapPosition) {
    this.store$.dispatch(new MapsAction.ChangePosition({mapId: this.mapId, position}));
  }

  public refreshMapSize() {
    this.mapGlobeContentComponent?.refreshContent();
  }

  public onMarkerDetail(properties: MapMarkerProperties) {
    if (properties.resourceType === AttributesResourceType.Collection) {
      this.modalService.showDocumentDetail(properties.dataResourceId, this.view?.id);
    } else if (properties.resourceType === AttributesResourceType.LinkType) {
      this.modalService.showLinkInstanceDetail(properties.dataResourceId, this.view?.id);
    }
  }

  public onSaveValue(data: {properties: MapMarkerProperties; value: string}) {
    const {properties, value} = data;
    if (properties.resourceType === AttributesResourceType.Collection) {
      this.store$.dispatch(
        new DocumentsAction.PatchData({
          document: {
            collectionId: properties.resourceId,
            id: properties.dataResourceId,
            data: {[properties.attributeId]: value},
          },
          workspace: this.currentWorkspace(),
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
          workspace: this.currentWorkspace(),
        })
      );
    }
  }

  private currentWorkspace(): Workspace {
    return {viewId: this.view?.id};
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

  private findResourceByProperty(type: AttributesResourceType, id: string): AttributesResource {
    if (type === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === id);
    } else if (type === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(linkType => linkType.id === id);
    }
    return null;
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
