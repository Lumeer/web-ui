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

import {CollectionService} from '../core/rest/collection.service';
import {Role} from '../shared/permissions/role';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class CollectionManageRoleGuard implements CanActivate {

  constructor(private collectionService: CollectionService) {
  }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const collectionCode = state.url.split('/').reverse()[1];

    const hasMangeRole = collection => collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(Role.Manage));

    return this.collectionService.getCollection(collectionCode)
      .map(hasMangeRole);
  }

}
