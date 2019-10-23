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
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  HostListener,
  TemplateRef,
  Output,
  EventEmitter,
} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {Query} from '../../../core/store/navigation/query/query';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BsModalRef} from 'ngx-bootstrap';
import {DialogType} from '../../../dialog/dialog-type';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {KeyCode} from '../../key-code';

@Component({
  selector: 'document-detail-modal',
  templateUrl: './document-detail-modal.component.html',
  styleUrls: ['./document-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailModalComponent implements OnInit, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Output()
  public documentChanged = new EventEmitter<DocumentModel>();

  public readonly dialogType = DialogType;

  public query$: Observable<Query>;
  public performingAction$ = new BehaviorSubject(false);

  private currentDocument: DocumentModel;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));

    this.subscribeExist();
  }

  private subscribeExist() {
    this.subscriptions.add(
      combineLatest([
        (this.collection.id && this.store$.pipe(select(selectCollectionById(this.collection.id)))) || of(true),
        (this.document.id && this.store$.pipe(select(selectDocumentById(this.document.id)))) || of(true),
      ]).subscribe(([collection, document]) => {
        if (!collection || !document) {
          this.hideDialog();
        }
      })
    );
  }

  public onSubmit() {
    this.performingAction$.next(true);
    const document = this.currentDocument || this.document;

    this.store$.dispatch(
      new DocumentsAction.Create({
        document,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    const {collection, document} = data;
    // this.setQueryWithCollection(collection);
    // this.select(collection, document);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }

  public onDocumentChanged(documentModel: DocumentModel) {
    this.documentChanged.emit(documentModel);
    this.currentDocument = documentModel;
  }
}
