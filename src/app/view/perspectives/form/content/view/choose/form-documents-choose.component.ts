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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../../../core/store/collections/collection';
import {ConstraintData} from '@lumeer/data-filters';
import {AttributesSettings, View} from '../../../../../../core/store/views/view';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {Observable} from 'rxjs';
import {AppState} from '../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {filterStemsForCollection} from '../../../../../../core/store/navigation/query/query.util';
import {selectDocumentsByCollectionAndQuery} from '../../../../../../core/store/common/permissions.selectors';
import {objectChanged} from '../../../../../../shared/utils/common.utils';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'form-documents-choose',
  templateUrl: './form-documents-choose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDocumentsChooseComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public documentId: string;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public view: View;

  @Input()
  public query: Query;

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  public documents$: Observable<DocumentModel[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection) || changes.query || changes.view) {
      this.subscribeToDocuments();
    }
  }

  private subscribeToDocuments() {
    const collectionQuery = filterStemsForCollection(this.collection.id, this.query);
    this.documents$ = this.store$.pipe(
      select(selectDocumentsByCollectionAndQuery(this.collection.id, collectionQuery, this.view)),
      tap(documents => this.checkAfterLoadedDocument(documents))
    );
  }

  private checkAfterLoadedDocument(documents: DocumentModel[]) {
    if (documents.length && (!this.documentId || documents.some(doc => doc.id === this.documentId))) {
      setTimeout(() => this.selectDocument.emit(documents[0]));
    }
  }

  public setActiveDocument(document: DocumentModel) {
    this.selectDocument.emit(document);
  }
}
