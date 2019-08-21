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

import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {Role} from '../../core/model/role';
import {AppState} from '../../core/store/app.state';
import {selectCollectionsDictionary} from '../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../core/store/link-types/link-types.state';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {ViewConfig, View} from '../../core/store/views/view';
import {userHasRoleInResource, userIsManagerInWorkspace} from '../../shared/utils/resource.utils';
import {Perspective} from '../perspectives/perspective';
import {getAllCollectionIdsFromQuery} from '../../core/store/navigation/query/query.util';
import {ResourceType} from '../../core/model/resource-type';
import {selectWorkspaceModels} from '../../core/store/common/common.selectors';
import {ResourcePermissionsPipe} from '../../shared/pipes/permissions/resource-permissions.pipe';
import {User} from '../../core/store/users/user';

@Pipe({
  name: 'viewControlsInfo',
  pure: false,
})
export class ViewControlsInfoPipe implements PipeTransform {
  constructor(private permissionsPipe: ResourcePermissionsPipe, private store$: Store<AppState>) {}

  public transform(
    view: View,
    name: string,
    config: ViewConfig,
    perspective: Perspective
  ): Observable<{canClone: boolean; canManage: boolean; canShare: boolean}> {
    if (!view || !view.code) {
      return this.canWriteInProject().pipe(map(canWrite => ({canClone: false, canManage: canWrite, canShare: false})));
    }

    return combineLatest([
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectWorkspaceModels)),
    ]).pipe(
      mergeMap(([currentUser, models]) => {
        if (userIsManagerInWorkspace(currentUser, models.organization, models.project)) {
          return of({canClone: true, canManage: true, canShare: true});
        }

        return combineLatest([
          this.hasDirectAccessToView(view, currentUser),
          this.permissionsPipe.transform(view, ResourceType.View),
        ]).pipe(
          map(([canClone, permissions]) => {
            const canWriteInProject = userHasRoleInResource(currentUser, models.project, Role.Write);
            return {
              canClone: canClone && canWriteInProject,
              canManage: permissions.manage,
              canShare: permissions.share,
            };
          })
        );
      })
    );
  }

  private canWriteInProject(): Observable<boolean> {
    return combineLatest([
      this.store$.pipe(select(selectCurrentUser)),
      this.store$.pipe(select(selectWorkspaceModels)),
    ]).pipe(
      map(
        ([currentUser, models]) =>
          userIsManagerInWorkspace(currentUser, models.organization, models.project) ||
          userHasRoleInResource(currentUser, models.project, Role.Write)
      )
    );
  }

  private hasDirectAccessToView(view: View, currentUser: User): Observable<boolean> {
    return combineLatest([
      this.store$.pipe(select(selectAllLinkTypes)),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(([linkTypes, collectionsMap]) => {
        return getAllCollectionIdsFromQuery(view.query, linkTypes)
          .map(collectionId => collectionsMap[collectionId])
          .every(collection => collection && userHasRoleInResource(currentUser, collection, Role.Read));
      })
    );
  }
}
