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
import {Observable, of, combineLatest as observableCombineLatest} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {LinkType} from '../../../core/store/link-types/link.type';
import {selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {CollectionPermissionsPipe} from './collection-permissions.pipe';
import {Collection} from '../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';

@Pipe({
  name: 'linkTypePermissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class LinkTypePermissionsPipe implements PipeTransform {
  public constructor(private store$: Store<AppState>, private collectionsPermissionsPipe: CollectionPermissionsPipe) {}

  public transform(linkType: LinkType): Observable<AllowedPermissions> {
    if (!linkType) {
      return of({});
    }

    return this.getCollectionsForLinkType(linkType).pipe(
      mergeMap(collections => {
        if (collections.length !== 2) {
          return of({});
        }

        return observableCombineLatest(
          this.collectionsPermissionsPipe.transform(collections[0]),
          this.collectionsPermissionsPipe.transform(collections[1])
        ).pipe(
          map(([ap1, ap2]) => {
            return {
              read: ap1.read && ap2.read,
              write: ap1.write && ap2.write,
              manage: ap1.manage && ap2.manage,
              readWithView: ap1.readWithView && ap2.readWithView,
              writeWithView: ap1.writeWithView && ap2.writeWithView,
              manageWithView: ap1.manageWithView && ap2.manageWithView,
            };
          })
        );
      })
    );
  }

  private getCollectionsForLinkType(linkType: LinkType): Observable<Collection[]> {
    return this.store$.pipe(
      select(selectCollectionsByIds(linkType.collectionIds)),
      map(collections => collections.filter(collection => !!collection))
    );
  }
}
