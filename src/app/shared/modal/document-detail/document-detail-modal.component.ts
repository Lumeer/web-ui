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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, Subject, Subscription, combineLatest, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {AttributesResourceType} from '../../../core/model/resource';
import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {Query} from '../../../core/store/navigation/query/query';
import {View} from '../../../core/store/views/view';
import {selectCurrentView, selectViewById, selectViewQuery} from '../../../core/store/views/views.state';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {objectChanged} from '../../utils/common.utils';
import {DialogType} from '../dialog-type';

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
  public viewId: string;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Output()
  public documentCreated = new EventEmitter();

  public readonly dialogType = DialogType;
  public readonly resourceType = AttributesResourceType.Collection;

  public onCancel$ = new Subject();

  public query$: Observable<Query>;
  public view$: Observable<View>;

  public collection$ = new BehaviorSubject<Collection>(null);
  public document$ = new BehaviorSubject<DocumentModel>(null);
  public performingAction$ = new BehaviorSubject(false);

  private dataExistSubscription = new Subscription();
  private initialModalsCount: number;

  constructor(
    private store$: Store<AppState>,
    private bsModalRef: BsModalRef,
    private bsModalService: BsModalService
  ) {}

  public ngOnInit() {
    this.selectCollectionAndDocument(this.collection, this.document);

    this.initialModalsCount = this.bsModalService.getModalsCount();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection) || objectChanged(changes.document)) {
      this.selectCollectionAndDocument(this.collection, this.document);
    }

    this.view$ = this.viewId
      ? this.store$.pipe(select(selectViewById(this.viewId)))
      : this.store$.pipe(select(selectCurrentView));
    this.query$ = this.selectQuery$();
  }

  private selectQuery$(): Observable<Query> {
    return this.view$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewQuery));
      })
    );
  }

  private subscribeExist(collection: Collection, document: DocumentModel) {
    this.dataExistSubscription.unsubscribe();
    this.dataExistSubscription = combineLatest([
      (collection?.id && this.store$.pipe(select(selectCollectionById(collection.id)))) || of(true),
      (document?.id && this.store$.pipe(select(selectDocumentById(document.id)))) || of(true),
    ]).subscribe(([currentCollection, currentDocument]) => {
      if (!currentCollection || !currentDocument) {
        this.hideDialog();
      }
    });
  }

  public onClose() {
    this.onCancel$.next(null);
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }

  public ngOnDestroy() {
    this.dataExistSubscription.unsubscribe();
  }

  public selectDocument(document: DocumentModel) {
    this.document$.next(document);

    this.subscribeExist(this.collection, document);
  }

  public selectCollectionAndDocument(collection: Collection, document: DocumentModel) {
    this.collection$.next(collection);
    this.document$.next(document);

    this.subscribeExist(collection, document);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    // when another dialog is presented in top of this dialog, we don't want to listen on escape events
    if (
      keyboardEventCode(event) === KeyCode.Escape &&
      !this.performingAction$.getValue() &&
      this.initialModalsCount >= this.bsModalService.getModalsCount()
    ) {
      this.onClose();
    }
  }

  public onDocumentChanged(documentModel: DocumentModel) {
    if (!documentModel.id) {
      this.createDocument(documentModel);
    }
  }

  public createDocument(document: DocumentModel) {
    this.performingAction$.next(true);

    this.store$.dispatch(
      new DocumentsAction.Create({
        document,
        workspace: {viewId: this.viewId},
        afterSuccess: document => {
          this.selectDocument(document);
          this.performingAction$.next(false);
          this.documentCreated.emit();
        },
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }
}
