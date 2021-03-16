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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

import {Observable, of} from 'rxjs';
import {catchError, filter, mergeMap, take, tap} from 'rxjs/operators';
import {selectCollectionById, selectCollectionsLoaded} from '../core/store/collections/collections.state';
import {select, Store} from '@ngrx/store';
import {AppState} from '../core/store/app.state';
import {Collection} from '../core/store/collections/collection';
import {CollectionsAction} from '../core/store/collections/collections.action';
import {Organization} from '../core/store/organizations/organization';
import {NotificationsAction} from '../core/store/notifications/notifications.action';
import {userHasManageRoleInResource, userIsManagerInWorkspace} from '../shared/utils/resource.utils';
import {WorkspaceService} from '../workspace/workspace.service';
import {User} from '../core/store/users/user';
import {Project} from '../core/store/projects/project';
import {CollectionService} from '../core/data-service';

@Injectable()
export class CollectionSettingsGuard implements CanActivate {
  constructor(
    private router: Router,
    private collectionService: CollectionService,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');
    const collectionId = next.paramMap.get('collectionId');

    return this.workspaceService.selectOrGetUserAndWorkspace(organizationCode, projectCode).pipe(
      mergeMap(({user, organization, project}) => {
        if (!organization) {
          const message = $localize`:@@organization.not.exist:Organization does not exist`;
          this.dispatchErrorActions(message);
          return of(false);
        }
        if (!project) {
          const message = $localize`:@@project.not.exist:Project does not exist`;
          this.dispatchErrorActions(message);
          return of(false);
        }

        return this.selectCollection(organization, project, collectionId).pipe(
          mergeMap(collection => this.checkCollection(user, collection, organization, project))
        );
      }),
      take(1),
      catchError(() => of(false))
    );
  }

  private selectCollection(organization: Organization, project: Project, collectionId: string): Observable<Collection> {
    return this.loadCollections(organization, project).pipe(
      mergeMap(() => this.store$.pipe(select(selectCollectionById(collectionId))))
    );
  }

  private loadCollections(organization: Organization, project: Project): Observable<boolean> {
    return this.store$.pipe(
      select(selectCollectionsLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new CollectionsAction.Get({workspace}));
        }
      }),
      filter(loaded => loaded),
      take(1)
    );
  }

  private checkCollection(
    user: User,
    collection: Collection,
    organization: Organization,
    project: Project
  ): Observable<boolean> {
    if (!collection) {
      this.dispatchErrorActionsNotExist();
      return of(false);
    }
    if (!userHasManageRoleInResource(user, collection) && !userIsManagerInWorkspace(user, organization, project)) {
      this.dispatchErrorActionsNotPermission();
      return of(false);
    }
    return this.workspaceService.switchWorkspace(organization, project);
  }

  private dispatchErrorActionsNotExist() {
    const message = $localize`:@@file.not.exist:Table does not exist`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = $localize`:@@file.permission.missing:You do not have permission to access this table`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }
}
