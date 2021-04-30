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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {AppState} from '../../../core/store/app.state';
import {map, switchMap} from 'rxjs/operators';
import {selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {uniqueValues} from '../../utils/array.utils';
import {ConstraintData} from '@lumeer/data-filters';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {getDataResourcesDataIds} from '../../utils/data-resource.utils';
import {selectLinkTypeByIds} from '../../../core/store/link-types/link-types.state';
import {attributesResourcesAreSame, getAttributesResourceType} from '../../utils/resource.utils';
import {selectDocumentsByIds} from '../../../core/store/documents/documents.state';
import {groupDocumentsByCollection} from '../../../core/store/documents/document.utils';
import {selectLinkInstancesByIds} from '../../../core/store/link-instances/link-instances.state';
import {groupLinkInstancesByLinkTypes} from '../../../core/store/link-instances/link-instance.utils';

@Component({
  templateUrl: './data-resources-detail-modal.component.html',
  styleUrls: ['./data-resources-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourcesDetailModalComponent implements OnInit {
  @Input()
  public dataResources: DataResource[];

  @Input()
  public title: string;

  public hasDuplicates: boolean;

  public selectedResourceSubject$ = new BehaviorSubject<AttributesResource>(null);
  public selectedDataResourceId$ = new BehaviorSubject<string>(null);
  public showDuplicates$ = new BehaviorSubject(true);

  public selectedResource$: Observable<AttributesResource>;
  public resources$: Observable<AttributesResource[]>;
  public dataResources$: Observable<DataResource[]>;
  public constraintData$: Observable<ConstraintData>;

  public readonly dialogType = DialogType;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));

    const {documentIds: allDocumentIds, linkInstanceIds: allLinkInstanceIds} = getDataResourcesDataIds(
      this.dataResources
    );

    this.hasDuplicates =
      allDocumentIds.length > uniqueValues(allDocumentIds).length ||
      allLinkInstanceIds.length > uniqueValues(allLinkInstanceIds).length;

    const documentsMap$ = this.showDuplicates$.pipe(
      map(showDuplicates => (showDuplicates ? allDocumentIds : uniqueValues(allDocumentIds))),
      switchMap(documentIds =>
        this.store$.pipe(
          select(selectDocumentsByIds(documentIds)),
          map(documents => groupDocumentsByCollection(documents))
        )
      )
    );

    const linkInstancesMap$ = this.showDuplicates$.pipe(
      map(showDuplicates => (showDuplicates ? allLinkInstanceIds : uniqueValues(allLinkInstanceIds))),
      switchMap(linkInstanceIds =>
        this.store$.pipe(
          select(selectLinkInstancesByIds(linkInstanceIds)),
          map(linkInstances => groupLinkInstancesByLinkTypes(linkInstances))
        )
      )
    );

    const collections$ = documentsMap$.pipe(
      map(documentsMap => Object.keys(documentsMap)),
      switchMap(collectionIds => this.store$.pipe(select(selectCollectionsByIds(collectionIds))))
    );

    const linkTypes$ = linkInstancesMap$.pipe(
      map(linkInstancesMap => Object.keys(linkInstancesMap)),
      switchMap(linkTypeIds => this.store$.pipe(select(selectLinkTypeByIds(linkTypeIds))))
    );

    this.resources$ = combineLatest([collections$, linkTypes$]).pipe(
      map(([collections, linkTypes]) => [...collections, ...linkTypes])
    );
    this.selectedResource$ = combineLatest([this.resources$, this.selectedResourceSubject$]).pipe(
      map(
        ([resources, selectedResource]) =>
          (selectedResource && resources.find(res => attributesResourcesAreSame(res, selectedResource))) || resources[0]
      )
    );

    this.dataResources$ = this.selectedResource$.pipe(
      switchMap(resource => {
        if (resource && getAttributesResourceType(resource) === AttributesResourceType.Collection) {
          return documentsMap$.pipe(map(documentsMap => documentsMap[resource.id]));
        } else if (resource) {
          return linkInstancesMap$.pipe(map(linkInstancesMap => linkInstancesMap[resource.id]));
        }
        return of([]);
      })
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSelectDataResource(dataResource: DataResource) {
    this.selectedDataResourceId$.next(dataResource.id);
  }

  public onSelectResource(resource: AttributesResource) {
    this.selectedResourceSubject$.next(resource);
  }
}
