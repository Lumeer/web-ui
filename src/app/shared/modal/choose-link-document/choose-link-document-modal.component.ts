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
import {ConstraintData} from '../../../core/model/data/constraint';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {AppState} from '../../../core/store/app.state';
import {selectDocumentsByIds} from '../../../core/store/documents/documents.state';
import {mergeMap, tap} from 'rxjs/operators';
import {selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {uniqueValues} from '../../utils/array.utils';
import {Query} from '../../../core/store/navigation/query/query';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsByCustomQuery} from '../../../core/store/common/permissions.selectors';

@Component({
  templateUrl: './choose-link-document-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseLinkDocumentModalComponent implements OnInit {
  @Input()
  public documentIds: string[];

  @Input()
  public collectionId: string;

  @Input()
  public callback: (document: DocumentModel) => void;

  public selectedCollectionId$ = new BehaviorSubject<string>(null);
  public selectedDocumentId$ = new BehaviorSubject<string>(null);
  public collections$: Observable<Collection[]>;
  public documents$: Observable<DocumentModel[]>;
  public constraintData$: Observable<ConstraintData>;

  public readonly dialogType = DialogType;

  private documents: DocumentModel[];

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    if (this.collectionId) {
      const query: Query = {stems: [{collectionId: this.collectionId}]};
      this.store$.dispatch(new DocumentsAction.Get({query}));
      this.documents$ = this.store$.pipe(
        select(selectDocumentsByCustomQuery(query)),
        tap(documents => {
          this.documents = documents;
          this.checkSelectedDocument(documents);
        })
      );
    } else {
      this.documents$ = this.store$.pipe(
        select(selectDocumentsByIds(this.documentIds)),
        tap(documents => {
          this.documents = documents;
          this.checkSelectedDocument(documents);
        })
      );
    }
    this.collections$ = this.documents$.pipe(
      mergeMap(documents => this.selectCollectionsByDocuments$(documents)),
      tap(collections => this.checkSelectedCollection(collections))
    );
  }

  private selectCollectionsByDocuments$(documents: DocumentModel[]): Observable<Collection[]> {
    const collectionIds = (documents || []).map(document => document.collectionId);
    return this.store$.pipe(select(selectCollectionsByIds(uniqueValues(collectionIds))));
  }

  private checkSelectedDocument(documents: DocumentModel[]) {
    if (this.selectedDocumentId$.value) {
      const documentExist = documents.some(document => document.id === this.selectedDocumentId$.value);
      if (!documentExist) {
        this.selectedDocumentId$.next(documents[0]?.id);
        this.selectedCollectionId$.next(documents[0]?.collectionId);
      }
    }
  }

  private checkSelectedCollection(collections: Collection[]) {
    if (this.selectedCollectionId$.value) {
      const collectionExist = collections.some(collection => collection.id === this.selectedCollectionId$.value);
      if (!collectionExist) {
        this.selectedDocumentId$.next(null);
        this.selectedCollectionId$.next(collections[0]?.id);
      }
    } else {
      this.selectedCollectionId$.next(collections[0]?.id);
    }
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit() {
    const documentId = this.selectedDocumentId$.getValue();
    const document = (this.documents || []).find(doc => doc.id === documentId);
    this.callback(document);
    this.hideDialog();
  }

  public onSelectDocument(document: DocumentModel) {
    this.selectedDocumentId$.next(document.id);
  }

  public onSelectCollection(collection: Collection) {
    this.selectedCollectionId$.next(collection.id);
  }
}
