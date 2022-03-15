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
import {select, Store} from '@ngrx/store';
import {AppState} from '../core/store/app.state';
import {Organization} from '../core/store/organizations/organization';
import {NotificationsAction} from '../core/store/notifications/notifications.action';
import {WorkspaceService} from '../workspace/workspace.service';
import {User} from '../core/store/users/user';
import {Project} from '../core/store/projects/project';
import {LinkTypeService} from '../core/data-service';
import {userCanManageLinkTypeDetail} from '../shared/utils/permission.utils';
import {LinkType} from '../core/store/link-types/link.type';
import {selectLinkTypeById, selectLinkTypesLoaded} from '../core/store/link-types/link-types.state';
import {LinkTypesAction} from '../core/store/link-types/link-types.action';

@Injectable()
export class LinkTypeSettingsGuard implements CanActivate {
  constructor(
    private router: Router,
    private linkTypeService: LinkTypeService,
    private workspaceService: WorkspaceService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');
    const linkTypeId = next.paramMap.get('linkTypeId');

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

        return this.selectLinkType(organization, project, linkTypeId).pipe(
          mergeMap(linkType =>
            this.checkLinkType(user, linkType, organization, project).pipe(
              tap(() => this.dispatchDataEvents(organization, project, linkType))
            )
          )
        );
      }),
      take(1),
      catchError(() => of(false))
    );
  }

  private selectLinkType(organization: Organization, project: Project, linkTypeId: string): Observable<LinkType> {
    return this.loadLinkTypes(organization, project).pipe(
      mergeMap(() => this.store$.pipe(select(selectLinkTypeById(linkTypeId))))
    );
  }

  private loadLinkTypes(organization: Organization, project: Project): Observable<boolean> {
    return this.store$.pipe(
      select(selectLinkTypesLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new LinkTypesAction.Get({workspace}));
        }
      }),
      filter(loaded => loaded),
      take(1)
    );
  }

  private checkLinkType(
    user: User,
    linkType: LinkType,
    organization: Organization,
    project: Project
  ): Observable<boolean> {
    if (!linkType) {
      this.dispatchErrorActionsNotExist();
      return of(false);
    }
    if (!userCanManageLinkTypeDetail(organization, project, linkType, user)) {
      this.dispatchErrorActionsNotPermission();
      return of(false);
    }
    return this.workspaceService.switchWorkspace(organization, project);
  }

  private dispatchErrorActionsNotExist() {
    const message = $localize`:@@linkType.not.exist:Link type does not exist`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = $localize`:@@linkType.permission.missing:You do not have permission to access this link type`;
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/auth']);
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }

  private dispatchDataEvents(organization: Organization, project: Project, linkType: LinkType) {
    this.store$.dispatch(
      new LinkTypesAction.GetSingle({
        linkTypeId: linkType.id,
        workspace: {organizationId: organization.id, projectId: project.id},
      })
    );
  }
}
