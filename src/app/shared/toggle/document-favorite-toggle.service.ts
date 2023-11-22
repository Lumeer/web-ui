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

import {Store} from '@ngrx/store';

import {UpdateValueService} from '../../core/service/update-value.service';
import {AppState} from '../../core/store/app.state';
import {DocumentModel} from '../../core/store/documents/document.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';

@Injectable()
export class DocumentFavoriteToggleService extends UpdateValueService<boolean, DocumentModel> {
  constructor(private store$: Store<AppState>) {
    super();
  }

  public processUpdate(id: string, value: boolean, data?: DocumentModel) {
    if (value) {
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

  public shouldUnsubscribePendingUpdate(previousValue: boolean, currentValue: boolean): boolean {
    return previousValue !== currentValue;
  }

  public processUpdateToStore(id: string, value: boolean, data?: DocumentModel) {
    if (value) {
      this.store$.dispatch(new DocumentsAction.AddFavoriteSuccess({documentId: id}));
    } else {
      this.store$.dispatch(new DocumentsAction.RemoveFavoriteSuccess({documentId: id}));
    }
  }
}
