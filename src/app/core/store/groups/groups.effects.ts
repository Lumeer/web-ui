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

import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {GroupService} from '../../rest';
import {NotificationsAction} from '../notifications/notifications.action';
import {GroupConverter} from './group.converter';
import {GroupsAction, GroupsActionType} from './groups.action';

@Injectable()
export class GroupsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.Get>(GroupsActionType.GET),
    mergeMap(() =>
      this.groupService.getGroups().pipe(
        map(dtos => dtos.map(dto => GroupConverter.fromDto(dto))),
        map(groups => new GroupsAction.GetSuccess({groups: groups})),
        catchError(error => of(new GroupsAction.GetFailure({error: error})))
      )
    )
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.GetFailure>(GroupsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'groups.get.fail', value: 'Could not get groups'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.Create>(GroupsActionType.CREATE),
    mergeMap(action => {
      const groupDto = GroupConverter.toDto(action.payload.group);

      return this.groupService.createGroup(groupDto).pipe(
        map(dto => GroupConverter.fromDto(dto)),
        map(group => new GroupsAction.CreateSuccess({group: group})),
        catchError(error => of(new GroupsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.CreateFailure>(GroupsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'group.create.fail', value: 'Could not create the group'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.Update>(GroupsActionType.UPDATE),
    mergeMap(action => {
      const groupDto = GroupConverter.toDto(action.payload.group);

      return this.groupService.updateGroup(groupDto.id, groupDto).pipe(
        map(dto => GroupConverter.fromDto(dto)),
        map(group => new GroupsAction.UpdateSuccess({group: group})),
        catchError(error => of(new GroupsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.UpdateFailure>(GroupsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'group.update.fail', value: 'Could not update the group'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.Delete>(GroupsActionType.DELETE),
    mergeMap(action =>
      this.groupService.deleteGroup(action.payload.groupId).pipe(
        map(() => new GroupsAction.DeleteSuccess(action.payload)),
        catchError(error => of(new GroupsAction.DeleteFailure({error: error})))
      )
    )
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<GroupsAction.DeleteFailure>(GroupsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'group.delete.fail', value: 'Could not delete the group'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions, private groupService: GroupService, private i18n: I18n) {}
}
