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

import {Component, ChangeDetectionStrategy, Input, OnInit} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Collection} from '../../../core/store/collections/collection';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {AppState} from '../../../core/store/app.state';
import {filter, map, mergeMap, switchMap} from 'rxjs/operators';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {CollectionAttributeFilter, Query} from '../../../core/store/navigation/query/query';
import {selectDocumentsByCustomQuery} from '../../../core/store/common/permissions.selectors';
import {ConstraintData} from '@lumeer/data-filters';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {getOtherLinkedCollectionId} from '../../utils/link-type.utils';

@Component({
  templateUrl: './modify-document-links-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModifyDocumentLinksModalComponent implements OnInit {
  @Input()
  public documentId: string;

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeIds: string[];

  public selectedLinkTypeId$ = new BehaviorSubject<string>(null);
  public filtersByLinkType$ = new BehaviorSubject<Record<string, CollectionAttributeFilter[]>>({});

  public collection$: Observable<Collection>;
  public documents$: Observable<DocumentModel[]>;
  public constraintData$: Observable<ConstraintData>;
  public query$: Observable<Query>;

  public readonly dialogType = DialogType;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.selectedLinkTypeId$.next(this.linkTypeIds[0]);
    this.collection$ = this.selectCollection$();
    this.query$ = this.selectQuery$();
    this.documents$ = this.query$.pipe(
      mergeMap(query => this.store$.pipe(select(selectDocumentsByCustomQuery(query))))
    );
  }

  private selectCollection$(): Observable<Collection> {
    return this.selectedLinkTypeId$.pipe(
      mergeMap(linkTypeId => this.store$.pipe(select(selectLinkTypeById(linkTypeId)))),
      filter(linkType => !!linkType),
      switchMap(linkType =>
        this.store$.pipe(select(selectCollectionById(getOtherLinkedCollectionId(linkType, this.collectionId))))
      )
    );
  }

  private selectQuery$(): Observable<Query> {
    return this.collection$.pipe(
      filter(collection => !!collection),
      switchMap(collection =>
        this.filtersByLinkType$.pipe(
          map(filters => ({stems: [{collectionId: collection.id, filters: filters[this.selectedLinkTypeId$.value]}]}))
        )
      )
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit() {
    this.hideDialog();
  }

  public onFiltersChange(filters: CollectionAttributeFilter[]) {
    const filtersByLinkType = {...this.filtersByLinkType$.value};
    filtersByLinkType[this.selectedLinkTypeId$.value] = filters;
    this.filtersByLinkType$.next(filtersByLinkType);
  }
}
