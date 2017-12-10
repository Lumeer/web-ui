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
import {Actions, Effect} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {GroupService} from '../../rest';
import {NotificationsAction} from '../notifications/notifications.action';
import {GroupConverter} from './group.converter';
import {GroupsAction, GroupsActionType} from './groups.action';

@Injectable()
export class GroupsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<GroupsAction.Get>(GroupsActionType.GET).pipe(
    switchMap(() => this.groupService.getGroups().pipe(
      map(dtos => dtos.map(dto => GroupConverter.fromDto(dto)))
    )),
    map(groups => new GroupsAction.GetSuccess({groups: groups})),
    catchError(error => Observable.of(new GroupsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<GroupsAction.GetFailure>(GroupsActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to get groups'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<GroupsAction.Create>(GroupsActionType.CREATE).pipe(
    switchMap(action => {
      const groupDto = GroupConverter.toDto(action.payload.group);

      return this.groupService.createGroup(groupDto).pipe(
        map(dto => GroupConverter.fromDto(dto))
      );
    }),
    map(group => new GroupsAction.CreateSuccess({group: group})),
    catchError(error => Observable.of(new GroupsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<GroupsAction.CreateFailure>(GroupsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to create group'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<GroupsAction.Update>(GroupsActionType.UPDATE).pipe(
    switchMap(action => {
      const groupDto = GroupConverter.toDto(action.payload.group);

      return this.groupService.updateGroup(groupDto.id, groupDto).pipe(
        map(dto => GroupConverter.fromDto(dto))
      );
    }),
    map(group => new GroupsAction.UpdateSuccess({group: group})),
    catchError(error => Observable.of(new GroupsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<GroupsAction.UpdateFailure>(GroupsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update group'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<GroupsAction.Delete>(GroupsActionType.DELETE).pipe(
    switchMap(action => this.groupService.deleteGroup(action.payload.groupId).pipe(
      map(() => action)
    )),
    map(action => new GroupsAction.DeleteSuccess(action.payload)),
    catchError(error => Observable.of(new GroupsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<GroupsAction.DeleteFailure>(GroupsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete group'}))
  );

  constructor(private actions$: Actions,
              private groupService: GroupService) {
  }

}
