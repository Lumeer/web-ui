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

import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store, select} from '@ngrx/store';

import {mergeMap, withLatestFrom} from 'rxjs/operators';

import {AppState} from '../app.state';
import {CollectionsAction} from '../collections/collections.action';
import {LinkTypesAction} from '../link-types/link-types.action';
import {ViewsAction} from '../views/views.action';
import {ResourcesAction, ResourcesActionType} from './data-resources.action';
import {selectResourcesOrganizationAndProject} from './data-resources.state';

@Injectable()
export class ResourcesEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourcesAction.Get>(ResourcesActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectResourcesOrganizationAndProject))),
      mergeMap(([action, {organizationId, projectId}]) => {
        if (action.payload.organizationId !== organizationId || action.payload.projectId !== projectId) {
          const workspace = {organizationId: action.payload.organizationId, projectId: action.payload.projectId};
          return [
            new CollectionsAction.Clear(),
            new CollectionsAction.Get({workspace}),
            new LinkTypesAction.Clear(),
            new LinkTypesAction.Get({workspace}),
            new ViewsAction.Clear(),
            new ViewsAction.Get({workspace}),
            new ResourcesAction.GetSuccess({...workspace}),
          ];
        }
        return [];
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>
  ) {}
}
