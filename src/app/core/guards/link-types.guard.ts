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
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';

import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {catchError, filter, take, tap} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {CollectionsAction} from '../store/collections/collections.action';
import {selectLinkTypesLoaded} from '../store/link-types/link-types.state';
import {LinkTypesAction} from '../store/link-types/link-types.action';

@Injectable()
export class LinkTypesGuard implements CanActivate {

  constructor(private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAndLoadLinkTypes().pipe(
      catchError(() => of(false))
    );
  }

  private checkAndLoadLinkTypes(): Observable<boolean> {
    return this.store.select(selectLinkTypesLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store.dispatch(new LinkTypesAction.Get({query: {}}));
        }
      }),
      filter(loaded => loaded),
      take(1)
    );
  }
}
