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
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ResourceModel} from '../../../core/model/resource.model';
import {AppState} from '../../../core/store/app.state';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {userHasRoleInResource} from '../../utils/resource.utils';

@Pipe({
  name: 'permissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class PermissionsPipe implements PipeTransform {
  public constructor(private store: Store<AppState>) {}

  public transform(resource: ResourceModel, role: string): Observable<boolean> {
    return this.store.select(selectCurrentUserForWorkspace).pipe(
      map(currentUser => {
        if (!currentUser || !resource) {
          return false;
        }

        return userHasRoleInResource(currentUser, resource, role);
      })
    );
  }
}
