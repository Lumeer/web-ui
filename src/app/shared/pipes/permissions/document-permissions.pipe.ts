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

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {CollectionPermissionsPipe} from './collection-permissions.pipe';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';

@Pipe({
  name: 'documentPermissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class DocumentPermissionsPipe implements PipeTransform {
  public constructor(private store$: Store<AppState>, private collectionsPermissionsPipe: CollectionPermissionsPipe) {}

  public transform(document: DocumentModel): Observable<AllowedPermissions> {
    if (!document) {
      return of({});
    }

    return this.getCollectionForDocument(document).pipe(
      mergeMap(collection => {
        if (!collection) {
          return of({});
        }

        return this.collectionsPermissionsPipe.transform(collection);
      })
    );
  }

  private getCollectionForDocument(document: DocumentModel): Observable<Collection> {
    return this.store$.pipe(select(selectCollectionById(document.collectionId)));
  }
}
