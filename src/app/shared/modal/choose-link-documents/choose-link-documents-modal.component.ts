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
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Collection} from '../../../core/store/collections/collection';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {AppState} from '../../../core/store/app.state';
import {switchMap, tap} from 'rxjs/operators';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsByCollectionAndQuery} from '../../../core/store/common/permissions.selectors';
import {ConstraintData} from '@lumeer/data-filters';
import {DataResource} from '../../../core/model/resource';
import {selectViewById} from '../../../core/store/views/views.state';
import {View, ViewSettings} from '../../../core/store/views/view';
import {selectViewSettingsByView} from '../../../core/store/view-settings/view-settings.state';

@Component({
  templateUrl: './choose-link-documents-modal.component.html',
  styleUrls: ['./choose-link-documents-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseLinkDocumentsModalComponent implements OnInit {
  @Input()
  public stems: QueryStem[];

  @Input()
  public viewId: string;

  @Input()
  public callback: (documents: DocumentModel[]) => void;

  @Input()
  public cancel: () => void;

  public selectedDocumentId$ = new BehaviorSubject<string>(null);
  public collection$: Observable<Collection>;
  public documents$: Observable<DocumentModel[]>;
  public constraintData$: Observable<ConstraintData>;
  public view$: Observable<View>;
  public viewSettings$: Observable<ViewSettings>;

  public readonly dialogType = DialogType;

  private documents: DocumentModel[];
  private currentStage = 0;
  private selectedDocuments: DocumentModel[] = [];

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.view$ = this.store$.pipe(select(selectViewById(this.viewId)));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.viewSettings$ = this.view$.pipe(switchMap(view => this.store$.pipe(select(selectViewSettingsByView(view)))));

    this.setupStage(0);
  }

  private setupStage(index: number) {
    this.currentStage = index;

    const stem = this.stems[index];
    const query: Query = {stems: [stem]};
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.documents$ = this.view$.pipe(
      switchMap(view => this.store$.pipe(select(selectDocumentsByCollectionAndQuery(stem.collectionId, query, view)))),
      tap(documents => {
        this.documents = documents;
        this.checkSelectedDocument(documents);
      })
    );
    this.collection$ = this.store$.pipe(select(selectCollectionById(stem.collectionId)));
  }

  private checkSelectedDocument(documents: DocumentModel[]) {
    const documentExist =
      this.selectedDocumentId$.value && documents.some(document => document.id === this.selectedDocumentId$.value);
    if (!documentExist) {
      this.selectedDocumentId$.next(documents[0]?.id);
    }
  }

  public onSelectDocument(dataResource: DataResource) {
    this.selectedDocumentId$.next(dataResource.id);
  }

  public onCancel() {
    this.cancel?.();
    this.hideDialog();
  }

  public onSubmit() {
    const documentId = this.selectedDocumentId$.getValue();
    this.selectedDocuments[this.currentStage] = (this.documents || []).find(doc => doc.id === documentId);

    if (this.stems[this.currentStage + 1]) {
      this.setupStage(this.currentStage + 1);
    } else {
      this.callback(this.selectedDocuments);
      this.hideDialog();
    }
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }
}
