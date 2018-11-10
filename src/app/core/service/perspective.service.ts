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

import {Perspective} from '../../view/perspectives/perspective';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {CollectionModel} from '../store/collections/collection.model';
import {DocumentModel} from '../store/documents/document.model';
import {ViewsAction} from '../store/views/views.action';
import {Router} from '@angular/router';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {filter, take} from 'rxjs/operators';
import {selectViewCursor} from '../store/views/views.state';

@Injectable({
  providedIn: 'root',
})
export class PerspectiveService {
  constructor(private store: Store<AppState>, private router: Router) {}

  public switchPerspective(
    perspective: Perspective,
    collection?: CollectionModel,
    document?: DocumentModel,
    queryToSet?: string
  ): void {
    if (collection && document) {
      // do we have any document selected?
      // update cursor
      this.store.dispatch(
        new ViewsAction.SetCursor({
          cursor: {collectionId: collection.id, documentId: document.id},
        })
      );

      // wait for the cursor to get updated
      this.store
        .select(selectViewCursor)
        .pipe(
          filter(cursor => cursor.collectionId === collection.id && cursor.documentId === document.id),
          take(1)
        )
        .subscribe(cursor => {
          this.navigateToPerspective(perspective, queryToSet);
        });
    } else {
      this.navigateToPerspective(perspective, queryToSet);
    }
  }

  private navigateToPerspective(perspective: Perspective, queryToSet?: string): void {
    this.store
      .select(selectWorkspace)
      .pipe(take(1))
      .subscribe(workspace => {
        const viewPath: any[] = ['w', workspace.organizationCode, workspace.projectCode, 'view'];
        viewPath.push(perspective.toString());

        if (queryToSet) {
          this.router.navigate(viewPath, {queryParams: {query: queryToSet}});
        } else {
          this.router.navigate(viewPath, {queryParamsHandling: 'preserve'});
        }
      });
  }
}
