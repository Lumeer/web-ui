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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectViewQuery} from '../../../../core/store/views/views.state';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {map} from 'rxjs/operators';
import {
  createFlatCollectionSettingsQueryStem,
  createFlatLinkTypeSettingsQueryStem,
  createFlatResourcesSettingsQuery,
} from '../../../../core/store/details/detail.utils';
import {getAttributesResourceType} from '../../../utils/resource.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';

@Component({
  selector: 'data-resources-detail',
  templateUrl: './data-resources-detail.component.html',
  styleUrls: ['./data-resources-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourcesDetailComponent implements OnInit {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Output()
  public routingPerformed = new EventEmitter();

  @Output()
  public back = new EventEmitter();

  public selectedResource$ = new BehaviorSubject<AttributesResource>(null);
  public selectedDataResource$ = new BehaviorSubject<DataResource>(null);

  public query$: Observable<Query>;
  public settingsQuery$: Observable<Query>;

  public detailSettingsQueryStem: QueryStem;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.select(this.dataResource, this.resource);

    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.settingsQuery$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(map(([collections, linkTypes]) => createFlatResourcesSettingsQuery(collections, linkTypes)));
  }

  public onDocumentSelect(data: {collection: Collection; document: DocumentModel}) {
    this.select(data.document, data.collection);
  }

  private select(dataResource: DataResource, resource: AttributesResource) {
    this.selectedResource$.next(resource);
    this.selectedDataResource$.next(dataResource);

    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
      this.detailSettingsQueryStem = createFlatCollectionSettingsQueryStem(resource);
    } else {
      this.detailSettingsQueryStem = createFlatLinkTypeSettingsQueryStem(<LinkType>resource);
    }
  }
}
