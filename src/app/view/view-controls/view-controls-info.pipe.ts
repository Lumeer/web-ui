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

import {Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {combineLatest as observableCombineLatest, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {Role} from '../../core/model/role';
import {AppState} from '../../core/store/app.state';
import {getCollectionsIdsFromView} from '../../core/store/collections/collection.util';
import {selectCollectionsDictionary} from '../../core/store/collections/collections.state';
import {selectAllDocuments} from '../../core/store/documents/documents.state';
import {selectAllLinkTypes} from '../../core/store/link-types/link-types.state';
import {QueryModel} from '../../core/store/navigation/query.model';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {ViewConfigModel, ViewModel} from '../../core/store/views/view.model';
import {PermissionsPipe} from '../../shared/pipes/permissions/permissions.pipe';
import {userHasRoleInResource} from '../../shared/utils/resource.utils';
import {Perspective} from '../perspectives/perspective';

@Pipe({
  name: 'viewControlsInfo',
})
export class ViewControlsInfoPipe implements PipeTransform {
  constructor(private permissionsPipe: PermissionsPipe, private store$: Store<AppState>) {}

  public transform(
    view: ViewModel,
    name: string,
    config: ViewConfigModel,
    perspective: Perspective,
    query: QueryModel
  ): Observable<{canClone: boolean; canManage: boolean}> {
    if (!view || !view.code) {
      return of({canClone: false, canManage: true});
    }

    return observableCombineLatest(
      this.hasDirectAccessToView(view),
      this.permissionsPipe.transform(view, Role.Manage)
    ).pipe(map(([canClone, canManage]) => ({canClone, canManage})));
  }

  public hasDirectAccessToView(view: ViewModel): Observable<boolean> {
    return observableCombineLatest(
      this.store$.select(selectCurrentUser),
      this.store$.select(selectAllLinkTypes),
      this.store$.select(selectAllDocuments),
      this.store$.select(selectCollectionsDictionary)
    ).pipe(
      map(([currentUser, linkTypes, documents, collectionsMap]) => {
        return getCollectionsIdsFromView(view, linkTypes, documents)
          .map(collectionId => collectionsMap[collectionId])
          .every(collection => collection && userHasRoleInResource(currentUser, collection, Role.Read));
      })
    );
  }
}
