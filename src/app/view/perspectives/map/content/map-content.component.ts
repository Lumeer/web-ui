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
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  MapConfig,
  MapMarkerData,
  MapMarkerProperties,
  MapModel,
  MapPosition,
} from '../../../../core/store/maps/map.model';
import {MapsAction} from '../../../../core/store/maps/maps.action';
import {ModalService} from '../../../../shared/modal/modal.service';
import {AttributesResourceType} from '../../../../core/model/resource';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {MapDataConverter} from './map-data-converter';
import {checkOrTransformMapConfig} from '../../../../core/store/maps/map-config.utils';
import {deepArrayEquals} from '../../../../shared/utils/array.utils';
import {MapGlobeContentComponent} from './globe-content/map-globe-content.component';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../../core/store/link-instances/link-instances.action';
import {ConstraintData} from '@lumeer/data-filters';
import {AppState} from '../../../../core/store/app.state';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  linkTypes: LinkType[];
  linkInstances: LinkInstance[];
  config: MapConfig;
  permissions: Record<string, AllowedPermissions>;
  query: Query;
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
      this.store$.dispatch(new MapsAction.SetConfig({mapId: this.map.id, config}));
    }

    return this.converter.convert(
      config,
      data.collections,
      data.documents,
      data.linkTypes,
      data.linkInstances,
      data.permissions,
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

  public onMapMove(position: MapPosition) {
    this.store$.dispatch(new MapsAction.ChangePosition({mapId: this.map.id, position}));
  }

  public refreshMapSize() {
    this.mapGlobeContentComponent?.refreshContent();
  }

  public onMarkerDetail(properties: MapMarkerProperties) {
    if (properties.resourceType === AttributesResourceType.Collection) {
      this.modalService.showDocumentDetail(properties.dataResourceId);
    } else if (properties.resourceType === AttributesResourceType.LinkType) {
      this.modalService.showLinkInstanceDetail(properties.dataResourceId);
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
}
