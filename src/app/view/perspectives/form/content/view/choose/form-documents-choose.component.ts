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
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {AppState} from '../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {filterStemsForCollection} from '../../../../../../core/store/navigation/query/query.util';
import {selectDocumentsByCollectionAndQuery} from '../../../../../../core/store/common/permissions.selectors';
import {objectChanged} from '../../../../../../shared/utils/common.utils';
import {map, tap} from 'rxjs/operators';
import {FormConfig} from '../../../../../../core/store/form/form-model';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {selectDocumentsByIds} from '../../../../../../core/store/documents/documents.state';
import {ModalService} from '../../../../../../shared/modal/modal.service';

@Component({
  selector: 'form-documents-choose',
  templateUrl: './form-documents-choose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDocumentsChooseComponent implements OnChanges {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public createdDocuments: string[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public view: View;

  @Input()
  public query: Query;

  @Output()
  public onAddNewRow = new EventEmitter();

  @Output()
  public selectDocument = new EventEmitter<DocumentModel>();

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  public addingNewRow: boolean;

  public documents$: Observable<DocumentModel[]>;
  public currentDocument$ = new BehaviorSubject<DocumentModel>(null);

  constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection) || changes.query || changes.view || changes.createdDocuments) {
      this.subscribeToDocuments();
    }
    if (changes.document) {
      this.currentDocument$.next(this.document);
      this.addingNewRow = this.document && !this.document.id;
    }
  }

  private subscribeToDocuments() {
    const collectionQuery = filterStemsForCollection(this.collection?.id, this.query);
    this.documents$ = combineLatest([
      this.store$.pipe(select(selectDocumentsByCollectionAndQuery(this.collection?.id, collectionQuery, this.view))),
      this.store$.pipe(select(selectDocumentsByIds(this.createdDocuments || []))),
      this.currentDocument$,
    ]).pipe(
      map(([documents, createdDocuments, currentDocument]) => {
        const documentsIds = documents.map(document => document.id);
        const additionalDocuments = createdDocuments.filter(document => !documentsIds.includes(document.id));
        if (currentDocument?.correlationId && !currentDocument?.id) {
          return [...documents, ...additionalDocuments, currentDocument];
        }
        return [...documents, ...additionalDocuments];
      }),
      tap(documents => this.checkAfterLoadedDocument(documents))
    );
  }

  private checkAfterLoadedDocument(documents: DocumentModel[]) {
    const hasDocumentsAndNotSelected = !this.document && documents.length > 0;
    const isSelectedButNotFound =
      this.document &&
      !documents.some(doc => (doc.id || doc.correlationId) === (this.document.id || this.document.correlationId));
    if (hasDocumentsAndNotSelected || isSelectedButNotFound) {
      setTimeout(() => this.selectDocument.emit(documents[0]));
    }
  }

  public setActiveDocument(document: DocumentModel) {
    this.selectDocument.emit(document);
  }

  public onTableHeightChange(tableHeight: number) {
    this.configChange.emit({...this.config, tableHeight});
  }

  public showDetailDocument(document: DocumentModel) {
    this.modalService.showDataResourceDetail(document, this.collection, this.view?.id);
  }
}
