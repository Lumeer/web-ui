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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, first, mergeMap, tap} from 'rxjs/operators';
import {AppState} from '../../store/app.state';
import {DocumentModel} from '../../store/documents/document.model';
import {DocumentsAction} from '../../store/documents/documents.action';
import {selectCurrentQueryDocumentsLoaded} from '../../store/documents/documents.state';
import {selectQuery} from '../../store/navigation/navigation.state';
import {selectDocumentsByQuery} from '../../store/common/permissions.selectors';
import {queryIsEmpty} from '../../store/navigation/query.util';

@Injectable({
  providedIn: 'root'
})
export class DocumentsGuard implements Resolve<DocumentModel[]> {

  public constructor(private store$: Store<AppState>) {
  }

  public resolve(route: ActivatedRouteSnapshot,
                 state: RouterStateSnapshot): Observable<DocumentModel[]> {
    return this.store$.select(selectQuery).pipe(
      mergeMap(query => this.store$.select(selectCurrentQueryDocumentsLoaded).pipe(
        tap(loaded => {
          if (!loaded) {
            const querySingleDocument = {...query, page: 0, pageSize: queryIsEmpty(query) ? 10 : 1000}; // TODO change count
            this.store$.dispatch(new DocumentsAction.Get({query: querySingleDocument}));
          }
        }),
        filter(loaded => loaded),
      )),
      mergeMap(() => this.store$.select(selectDocumentsByQuery)),
      first()
    );
  }

}
