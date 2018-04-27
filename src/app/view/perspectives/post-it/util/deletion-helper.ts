/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {LumeerError} from '../../../../core/error/lumeer.error';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {selectAllDocuments} from '../../../../core/store/documents/documents.state';
import {PostItDocumentModel} from '../document-data/post-it-document-model';

export class DeletionHelper {

  private documentsSubscription: Subscription;

  constructor(private store: Store<AppState>, private postIts: PostItDocumentModel[]) {
  }

  public initialize(): void {
    if (this.documentsSubscription) {
      throw new LumeerError('DeletionHelper already initialized');
    }

    this.documentsSubscription = this.store.select(selectAllDocuments).subscribe(documents => {
      this.removeDeletedDocuments(documents);
    });
  }

  public deletePostIt(postIt: PostItDocumentModel): void {
    this.postIts.splice(postIt.index, 1);
  }

  public unsubscribe(): void {
    if (this.documentsSubscription) {
      this.documentsSubscription.unsubscribe();
    }
  }

  private removeDeletedDocuments(documents: DocumentModel[]): void {
    const shownDocumentsIds = new Set(this.postIts.map(postIt => postIt.document.id));
    const existingDocumentsIds = new Set(documents.map(document => document.id));

    shownDocumentsIds.forEach(shownDocumentId => {
      if (!existingDocumentsIds.has(shownDocumentId)) {
        const deletedPostIt = this.postIts.find(postIt => postIt.document.id === shownDocumentId);
        this.deletePostIt(deletedPostIt);
      }
    });
  }

}
