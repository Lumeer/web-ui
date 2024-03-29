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
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {first, mergeMap, skipWhile, tap} from 'rxjs/operators';

import {WorkspaceService} from '../../../workspace/workspace.service';
import {AppState} from '../../store/app.state';
import {LinkTypesAction} from '../../store/link-types/link-types.action';
import {selectAllLinkTypes, selectLinkTypesLoaded} from '../../store/link-types/link-types.state';
import {LinkType} from '../../store/link-types/link.type';

@Injectable()
export class LinkTypesGuard {
  constructor(
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService
  ) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LinkType[]> {
    const organizationCode = route.paramMap.get('organizationCode');
    const projectCode = route.paramMap.get('projectCode');

    return this.workspaceService.selectOrGetWorkspace(organizationCode, projectCode).pipe(
      mergeMap(({organization, project}) => {
        return this.store$.pipe(
          select(selectLinkTypesLoaded),
          tap(loaded => {
            if (!loaded) {
              const workspace = {organizationId: organization.id, projectId: project.id};
              this.store$.dispatch(new LinkTypesAction.Get({workspace}));
            }
          }),
          skipWhile(loaded => !loaded),
          mergeMap(() => this.store$.pipe(select(selectAllLinkTypes))),
          first()
        );
      })
    );
  }
}
