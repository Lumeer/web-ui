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
import {filter, map, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {CollectionAttributeFilter, Query} from '../../../core/store/navigation/query/query';
import {selectDocumentsByCustomQuery} from '../../../core/store/common/permissions.selectors';
import {ConstraintData} from '@lumeer/data-filters';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {getOtherLinkedCollectionId} from '../../utils/link-type.utils';
import {LinkType} from '../../../core/store/link-types/link.type';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {selectLinkInstancesByTypeAndDocuments} from '../../../core/store/link-instances/link-instances.state';
import {ResultTableRow} from './results-table/results-table.component';
import {uniqueValues} from '../../utils/array.utils';
import {getOtherDocumentIdFromLinkInstance} from '../../../core/store/link-instances/link-instance.utils';
import {selectDocumentsByIds} from '../../../core/store/documents/documents.state';
import {mergeDocuments} from '../../../core/store/documents/document.utils';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {generateCorrelationId} from '../../utils/resource.utils';
import {Workspace} from '../../../core/store/navigation/workspace';

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

  @Input()
  public workspace: Workspace;

  public selectedLinkTypeId$ = new BehaviorSubject<string>(null);
  public filtersByLinkType$ = new BehaviorSubject<Record<string, CollectionAttributeFilter[]>>({});
  public removedLinkInstancesIds$ = new BehaviorSubject([]);
  public selectedDocumentIds$ = new BehaviorSubject([]);
  public performingAction$ = new BehaviorSubject(false);

  public linkType$: Observable<LinkType>;
  public collection$: Observable<Collection>;
  public linkInstances$: Observable<LinkInstance[]>;
  public documents$: Observable<DocumentModel[]>;
  public constraintData$: Observable<ConstraintData>;
  public query$: Observable<Query>;

  public readonly dialogType = DialogType;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.selectedLinkTypeId$.next(this.linkTypeIds[0]);
    this.linkType$ = this.selectLinkType$();
    this.collection$ = this.selectCollection$();
    this.query$ = this.selectQuery$();
    this.linkInstances$ = this.selectedLinkTypeId$.pipe(
      mergeMap(linkTypeId =>
        this.store$.pipe(select(selectLinkInstancesByTypeAndDocuments(linkTypeId, [this.documentId])))
      )
    );
    this.documents$ = this.query$.pipe(
      mergeMap(query => this.store$.pipe(select(selectDocumentsByCustomQuery(query)))),
      mergeMap(documentsByQuery =>
        this.selectAlwaysVisibleDocuments$().pipe(
          map(alwaysVisibleDocuments => mergeDocuments(alwaysVisibleDocuments, documentsByQuery))
        )
      )
    );
  }

  private selectAlwaysVisibleDocuments$(): Observable<DocumentModel[]> {
    return this.linkInstances$.pipe(
      withLatestFrom(this.removedLinkInstancesIds$, this.selectedDocumentIds$),
      map(([linkInstances, removedLinkInstancesIds, selectedDocumentIds]) => {
        const selectedLinkInstances = linkInstances.filter(
          linkInstance => !removedLinkInstancesIds.includes(linkInstance.id)
        );
        const documentsIdsByLinks = selectedLinkInstances.map(linkInstance =>
          getOtherDocumentIdFromLinkInstance(linkInstance, this.documentId)
        );
        return uniqueValues([...documentsIdsByLinks, ...selectedDocumentIds]);
      }),
      switchMap(documentsIds => this.store$.pipe(select(selectDocumentsByIds(documentsIds))))
    );
  }

  private selectLinkType$(): Observable<LinkType> {
    return this.selectedLinkTypeId$.pipe(
      switchMap(linkTypeId => this.store$.pipe(select(selectLinkTypeById(linkTypeId))))
    );
  }

  private selectCollection$(): Observable<Collection> {
    return this.linkType$.pipe(
      filter(linkType => !!linkType),
      switchMap(linkType =>
        this.store$.pipe(select(selectCollectionById(getOtherLinkedCollectionId(linkType, this.collectionId))))
      ),
      tap(collection =>
        this.store$.dispatch(
          new DocumentsAction.Get({query: {stems: [{collectionId: collection.id}]}, workspace: this.workspace})
        )
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
    this.performingAction$.next(true);

    const linkTypeId = this.selectedLinkTypeId$.value;
    const linkInstances: LinkInstance[] = this.selectedDocumentIds$.value.map(otherDocumentId => ({
      data: {},
      correlationId: generateCorrelationId(),
      linkTypeId,
      documentIds: [this.documentId, otherDocumentId],
    }));

    this.store$.dispatch(
      new LinkInstancesAction.SetDocumentLinks({
        removedLinkInstancesIds: this.removedLinkInstancesIds$.value,
        documentId: this.documentId,
        linkInstances,
        linkTypeId,
        workspace: this.workspace,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public onFiltersChange(filters: CollectionAttributeFilter[]) {
    const filtersByLinkType = {...this.filtersByLinkType$.value};
    filtersByLinkType[this.selectedLinkTypeId$.value] = filters;
    this.filtersByLinkType$.next(filtersByLinkType);
  }

  public onRowSelected(row: ResultTableRow) {
    if (row.linkInstance) {
      this.removedLinkInstancesIds$.next(this.removedLinkInstancesIds$.value.filter(id => row.linkInstance.id !== id));
    } else {
      this.selectedDocumentIds$.next([...this.selectedDocumentIds$.value, row.document.id]);
    }
  }

  public onRowUnselected(row: ResultTableRow) {
    if (row.linkInstance) {
      this.removedLinkInstancesIds$.next([...this.removedLinkInstancesIds$.value, row.linkInstance.id]);
    } else {
      this.selectedDocumentIds$.next(this.selectedDocumentIds$.value.filter(id => row.document.id !== id));
    }
  }

  public onSelectAll(data: {documentsIds: string[]; linkInstancesIds: string[]}) {
    this.selectedDocumentIds$.next(data.documentsIds);
    this.removedLinkInstancesIds$.next(
      this.removedLinkInstancesIds$.value.filter(id => !data.linkInstancesIds.includes(id))
    );
  }

  public onUnSelectAll(data: {documentsIds: string[]; linkInstancesIds: string[]}) {
    this.selectedDocumentIds$.next(data.documentsIds);
    this.removedLinkInstancesIds$.next(data.linkInstancesIds);
  }
}
