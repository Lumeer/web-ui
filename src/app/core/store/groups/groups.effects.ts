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

import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {GroupService} from '../../rest';
import {NotificationsAction} from '../notifications/notifications.action';
import {GroupConverter} from './group.converter';
import {GroupsAction, GroupsActionType} from './groups.action';

@Injectable()
export class GroupsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.Get>(GroupsActionType.GET),
      mergeMap(() =>
        this.groupService.getGroups().pipe(
          map(dtos => dtos.map(dto => GroupConverter.fromDto(dto))),
          map(groups => new GroupsAction.GetSuccess({groups: groups})),
          catchError(error => of(new GroupsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.GetFailure>(GroupsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@groups.get.fail:Could not get groups`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.Create>(GroupsActionType.CREATE),
      mergeMap(action => {
        const groupDto = GroupConverter.toDto(action.payload.group);

        return this.groupService.createGroup(groupDto).pipe(
          map(dto => GroupConverter.fromDto(dto)),
          map(group => new GroupsAction.CreateSuccess({group: group})),
          catchError(error => of(new GroupsAction.CreateFailure({error})))
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.CreateFailure>(GroupsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@group.create.fail:Could not create the group`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.Update>(GroupsActionType.UPDATE),
      mergeMap(action => {
        const groupDto = GroupConverter.toDto(action.payload.group);

        return this.groupService.updateGroup(groupDto.id, groupDto).pipe(
          map(dto => GroupConverter.fromDto(dto)),
          map(group => new GroupsAction.UpdateSuccess({group: group})),
          catchError(error => of(new GroupsAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.UpdateFailure>(GroupsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@group.update.fail:Could not update the group`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.Delete>(GroupsActionType.DELETE),
      mergeMap(action =>
        this.groupService.deleteGroup(action.payload.groupId).pipe(
          map(() => new GroupsAction.DeleteSuccess(action.payload)),
          catchError(error => of(new GroupsAction.DeleteFailure({error})))
        )
      )
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<GroupsAction.DeleteFailure>(GroupsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@group.delete.fail:Could not delete the group`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(private actions$: Actions, private groupService: GroupService) {}
}
