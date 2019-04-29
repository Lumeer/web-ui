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
import {Observable, of} from 'rxjs';
import {mergeMap} from 'rxjs/operators';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {AppState} from '../../../core/store/app.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {LinkTypePermissionsPipe} from './link-type-permissions.pipe';

@Pipe({
  name: 'linkInstancePermissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class LinkInstancePermissionsPipe implements PipeTransform {
  public constructor(private store: Store<AppState>, private linkTypePermissionsPipe: LinkTypePermissionsPipe) {}

  public transform(linkInstance: LinkInstance): Observable<AllowedPermissions> {
    if (!linkInstance) {
      return of({});
    }

    return this.store.pipe(
      select(selectLinkTypeById(linkInstance.linkTypeId)),
      mergeMap(linkType => this.linkTypePermissionsPipe.transform(linkType))
    );
  }
}
