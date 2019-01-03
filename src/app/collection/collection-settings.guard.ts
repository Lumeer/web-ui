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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

import {CollectionService} from '../core/rest';
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, take, tap} from 'rxjs/operators';
import {selectCollectionById, selectCollectionsLoaded} from '../core/store/collections/collections.state';
import {select, Store} from '@ngrx/store';
import {AppState} from '../core/store/app.state';
import {Collection} from '../core/store/collections/collection';
import {CollectionsAction} from '../core/store/collections/collections.action';
import {Organization} from '../core/store/organizations/organization';
import {NotificationsAction} from '../core/store/notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {userHasManageRoleInResource, userIsManagerInWorkspace} from '../shared/utils/resource.utils';
import {selectCurrentUserForWorkspace} from '../core/store/users/users.state';
import {WorkspaceService} from '../workspace/workspace.service';
import {isNullOrUndefined} from '../shared/utils/common.utils';
import {User} from '../core/store/users/user';
import {Project} from '../core/store/projects/project';

@Injectable()
export class CollectionSettingsGuard implements CanActivate {
  constructor(
    private i18n: I18n,
    private router: Router,
    private collectionService: CollectionService,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');
    const collectionId = next.paramMap.get('collectionId');

    return this.selectCollection(collectionId).pipe(
      mergeMap(collection => {
        if (!collection) {
          this.dispatchErrorActionsNotExist();
          return of(false);
        }

        return this.checkCollection(collection, organizationCode, projectCode);
      }),
      take(1),
      catchError(() => of(false))
    );
  }

  private selectCollection(collectionId: string): Observable<Collection> {
    return this.loadCollections().pipe(mergeMap(() => this.store$.pipe(select(selectCollectionById(collectionId)))));
  }

  private loadCollections(): Observable<boolean> {
    return this.store$.pipe(
      select(selectCollectionsLoaded),
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new CollectionsAction.Get({}));
        }
      }),
      filter(loaded => loaded),
      take(1)
    );
  }

  private checkCollection(collection: Collection, organizationCode: string, projectCode: string): Observable<boolean> {
    return this.selectUserAndWorkspace(organizationCode, projectCode).pipe(
      map(({user, organization, project}) => {
        if (!userHasManageRoleInResource(user, collection) && !userIsManagerInWorkspace(user, organization, project)) {
          this.dispatchErrorActionsNotPermission();
          return false;
        }
        return true;
      })
    );
  }

  private selectUserAndWorkspace(
    organizationCode: string,
    projectCode: string
  ): Observable<{user?: User; organization?: Organization; project?: Project}> {
    return this.workspaceService
      .getOrganizationFromStoreOrApi(organizationCode)
      .pipe(
        mergeMap(organization =>
          this.selectUserAndProject(organization, projectCode).pipe(
            map(({user, project}) => ({user, organization, project}))
          )
        )
      );
  }

  private selectUserAndProject(
    organization: Organization,
    projectCode: string
  ): Observable<{user?: User; project?: Project}> {
    if (organization) {
      return combineLatest(
        this.selectUser(),
        this.workspaceService.getProjectFromStoreOrApi(organization.code, organization.id, projectCode)
      ).pipe(map(([user, project]) => ({user, project})));
    }
    return this.selectUser().pipe(map(user => ({user})));
  }

  private selectUser(): Observable<User> {
    return this.store$.pipe(
      select(selectCurrentUserForWorkspace),
      filter(user => !isNullOrUndefined(user))
    );
  }

  private dispatchErrorActionsNotExist() {
    const message = this.i18n({id: 'file.not.exist', value: 'Collection does not exist'});
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = this.i18n({
      id: 'file.permission.missing',
      value: 'You do not have permission to access this collection',
    });
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }
}
