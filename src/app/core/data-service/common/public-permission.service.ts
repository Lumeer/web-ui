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
import {Observable, of} from 'rxjs';

import {PermissionDto, PermissionsDto} from '../../dto';
import {BaseService} from '../../rest/base.service';
import {Workspace} from '../../store/navigation/workspace';
import {PermissionService} from './permission.service';

export abstract class PublicPermissionService extends BaseService implements PermissionService {
  public getPermissions(): Observable<PermissionsDto> {
    return of({users: [], groups: []});
  }

  public updateUserPermission(userPermissions: PermissionDto[], workspace?: Workspace): Observable<PermissionDto> {
    return of({id: '', roles: []});
  }

  public updateGroupPermission(userPermissions: PermissionDto[], workspace?: Workspace): Observable<PermissionDto> {
    return of({id: '', roles: []});
  }

  public removeUserPermission(user: string): Observable<any> {
    return of(true);
  }

  public removeGroupPermission(group: string): Observable<any> {
    return of(true);
  }
}
