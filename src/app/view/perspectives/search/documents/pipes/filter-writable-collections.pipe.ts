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

import {Pipe, PipeTransform} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {CollectionsPermissionsPipe} from '../../../../../shared/pipes/permissions/collections-permissions.pipe';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Pipe({
  name: 'filterWritableCollections',
})
export class FilterWritableCollectionsPipe implements PipeTransform {
  constructor(private collectionsPermissions: CollectionsPermissionsPipe) {}

  public transform(collections: Collection[]): Observable<Collection[]> {
    const collectionsMap = (collections || []).reduce((obj, coll) => ({...obj, [coll.id]: coll}), {});
    return this.collectionsPermissions.transform(collections).pipe(
      map(permissions =>
        Object.entries(permissions)
          .map(([key, permission]) => {
            if (permission.writeWithView) {
              return collectionsMap[key];
            }
            return null;
          })
          .filter(collection => !!collection)
      )
    );
  }
}
