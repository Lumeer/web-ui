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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {DialogType} from '../../../../../shared/modal/dialog-type';
import {BsModalRef} from 'ngx-bootstrap';
import {Collection} from '../../../../../core/store/collections/collection';
import {BehaviorSubject} from 'rxjs';

@Component({
  templateUrl: './choose-link-document-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseLinkDocumentModalComponent {
  @Input()
  public documents: DocumentModel[];

  @Input()
  public collection: Collection;

  @Input()
  public callback: (document: DocumentModel) => void;

  public selectedDocumentId$ = new BehaviorSubject<string>(null);

  public readonly dialogType = DialogType;

  constructor(private bsModalRef: BsModalRef) {}

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
