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
import {BsModalRef} from 'ngx-bootstrap';
import {Collection} from '../../../core/store/collections/collection';
import {BehaviorSubject, Observable} from 'rxjs';
import {ConstraintData} from '../../../core/model/data/constraint';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {AppState} from '../../../core/store/app.state';

@Component({
  templateUrl: './choose-link-document-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseLinkDocumentModalComponent implements OnInit {
  @Input()
  public documents: DocumentModel[];

  @Input()
  public collection: Collection;

  @Input()
  public callback: (document: DocumentModel) => void;

  public selectedDocumentId$ = new BehaviorSubject<string>(null);

  public readonly dialogType = DialogType;

  public constraintData$: Observable<ConstraintData>;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
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
}
