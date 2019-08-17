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

import {Injectable} from '@angular/core';
import {DocumentModel} from '../../core/store/documents/document.model';
import {Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {ToggleService} from './toggle.service';

@Injectable()
export class DocumentFavoriteToggleService extends ToggleService<DocumentModel> {
  constructor(private store$: Store<AppState>) {
    super();
  }

  public processToggle(id: string, active: boolean, data?: DocumentModel) {
    if (active) {
      this.store$.dispatch(
        new DocumentsAction.AddFavorite({
          documentId: id,
          collectionId: data.collectionId,
          workspace: this.workspace,
        })
      );
    } else {
      this.store$.dispatch(
        new DocumentsAction.RemoveFavorite({
          documentId: id,
          collectionId: data.collectionId,
          workspace: this.workspace,
        })
      );
    }
  }

  public processToggleToStore(id: string, active: boolean, data?: DocumentModel) {
    if (active) {
      this.store$.dispatch(new DocumentsAction.AddFavoriteSuccess({documentId: id}));
    } else {
      this.store$.dispatch(new DocumentsAction.RemoveFavoriteSuccess({documentId: id}));
    }
  }
}
