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
import {first, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {AppState} from '../../store/app.state';
import {CollectionModel} from '../../store/collections/collection.model';
import {CollectionsAction} from '../../store/collections/collections.action';
import {selectAllCollections, selectCollectionsLoaded} from '../../store/collections/collections.state';

@Injectable()
export class CollectionsGuard implements Resolve<CollectionModel[]> {
  constructor(private store$: Store<AppState>) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<CollectionModel[]> {
    return this.store$.select(selectCollectionsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new CollectionsAction.Get());
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.select(selectAllCollections)),
      first()
    );
  }
}
