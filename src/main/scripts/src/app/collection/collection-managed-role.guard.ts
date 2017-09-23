/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';

import {CollectionService} from '../core/rest/collection.service';
import {Role} from '../shared/permissions/role';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/retry';

@Injectable()
export class CollectionManageRoleGuard implements CanActivate {

  constructor(private collectionService: CollectionService) {
  }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const collectionCode = state.url.split('/').reverse()[1];

    const hasMangeRole = collection => collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(Role.Manage));

    return this.collectionService.getCollection(collectionCode)
      .retry(3)
      .map(hasMangeRole);
  }

}
