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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {UserService} from '../../rest';
import {NotificationsAction} from '../notifications/notifications.action';
import {UserConverter} from './user.converter';
import {UsersAction, UsersActionType} from './users.action';

@Injectable()
export class UsersEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Get>(UsersActionType.GET),
    mergeMap((action) => this.userService.getUsers(action.payload.organizationId).pipe(
      map(dtos => dtos.map(dto => UserConverter.fromDto(dto)))
    )),
    map(users => new UsersAction.GetSuccess({users: users})),
    catchError(error => Observable.of(new UsersAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.GetFailure>(UsersActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'users.get.fail', value: 'Failed to get users'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Create>(UsersActionType.CREATE),
    mergeMap(action => {
      const userDto = UserConverter.toDto(action.payload.user);

      return this.userService.createUser(action.payload.organizationId, userDto).pipe(
        map(dto => UserConverter.fromDto(dto))
      );
    }),
    map(user => new UsersAction.CreateSuccess({user: user})),
    catchError(error => Observable.of(new UsersAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.CreateFailure>(UsersActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'user.create.fail', value: 'Failed to create user'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Update>(UsersActionType.UPDATE),
    mergeMap(action => {
      const userDto = UserConverter.toDto(action.payload.user);

      return this.userService.updateUser(action.payload.organizationId, userDto.id, userDto).pipe(
        map(dto => UserConverter.fromDto(dto))
      );
    }),
    map(user => new UsersAction.UpdateSuccess({user: user})),
    catchError(error => Observable.of(new UsersAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.UpdateFailure>(UsersActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'user.update.fail', value: 'Failed to update user'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Delete>(UsersActionType.DELETE),
    mergeMap(action => this.userService.deleteUser(action.payload.organizationId, action.payload.userId).pipe(
      map(() => action)
    )),
    map(action => new UsersAction.DeleteSuccess(action.payload)),
    catchError(error => Observable.of(new UsersAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.DeleteFailure>(UsersActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'user.delete.fail', value: 'Failed to delete user'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private userService: UserService) {
  }

}
