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

import {map} from 'rxjs/operators';
import {Collection} from '../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {CollectionsPermissionsPipe} from './collections-permissions.pipe';
import {Observable, of} from 'rxjs';

@Pipe({
  name: 'collectionPermissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class CollectionPermissionsPipe implements PipeTransform {
  public constructor(private collectionsPermissionsPipe: CollectionsPermissionsPipe) {}

  public transform(collection: Collection): Observable<AllowedPermissions> {
    if (!collection) {
      return of({});
    }
    return this.collectionsPermissionsPipe.transform([collection]).pipe(map(permissions => permissions[collection.id]));
  }
}
