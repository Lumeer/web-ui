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
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, Subject, Subscription} from 'rxjs';
import {Query} from '../../../core/store/navigation/query/query';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {DialogType} from '../dialog-type';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {KeyCode} from '../../key-code';
import {ViewSettings} from '../../../core/store/views/view';
import {selectViewSettings} from '../../../core/store/views/views.state';
import {ResourceType} from '../../../core/model/resource-type';
import {AttributesResourceType} from '../../../core/model/resource';

@Component({
  selector: 'document-detail-modal',
  templateUrl: './document-detail-modal.component.html',
  styleUrls: ['./document-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Output()
  public documentChanged = new EventEmitter<DocumentModel>();

  public readonly dialogType = DialogType;
  public readonly resourceType = AttributesResourceType.Collection;

  public onCancel$ = new Subject();

  public query$: Observable<Query>;
  public collection$: Observable<Collection>;
  public document$: Observable<DocumentModel>;
  public viewSettings$: Observable<ViewSettings>;

  public performingAction$ = new BehaviorSubject(false);

  private currentDocument: DocumentModel;
  private dataExistSubscription = new Subscription();

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {}

  public ngOnInit() {
    this.initData();
    this.query$ = this.store$.pipe(select(selectQuery));
    this.viewSettings$ = this.store$.pipe(select(selectViewSettings));
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.initData();
  }

  private initData() {
    this.collection$ = of(this.collection);
    this.document$ = of(this.document);

    this.subscribeExist(this.collection, this.document);
  }

  private subscribeExist(collection: Collection, document: DocumentModel) {
    this.dataExistSubscription.unsubscribe();
    this.dataExistSubscription = combineLatest([
      (collection.id && this.store$.pipe(select(selectCollectionById(collection.id)))) || of(true),
      (document.id && this.store$.pipe(select(selectDocumentById(document.id)))) || of(true),
    ]).subscribe(([currentCollection, currentDocument]) => {
      if (!currentCollection || !currentDocument) {
        this.hideDialog();
      }
    });
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

  public onClose() {
    this.onCancel$.next();
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }

  public ngOnDestroy() {
    this.dataExistSubscription.unsubscribe();
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    this.collection$ = of(data.collection);
    this.document$ = of(data.document);
    this.subscribeExist(data.collection, data.document);
    this.currentDocument = data.document;
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.onClose();
    }
  }

  public onDocumentChanged(documentModel: DocumentModel) {
    this.documentChanged.emit(documentModel);
    this.currentDocument = documentModel;
  }
}
