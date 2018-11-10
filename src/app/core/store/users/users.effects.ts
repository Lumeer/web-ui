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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {from, Observable, of} from 'rxjs';
import {catchError, concatMap, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {UserService} from '../../rest';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary} from '../organizations/organizations.state';
import {RouterAction} from '../router/router.action';
import {DefaultWorkspaceConverter, UserConverter} from './user.converter';
import {UsersAction, UsersActionType} from './users.action';
import {selectCurrentUser, selectUsersLoadedForOrganization} from './users.state';

@Injectable()
export class UsersEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Get>(UsersActionType.GET),
    withLatestFrom(this.store$.select(selectUsersLoadedForOrganization)),
    filter(([action, loadedOrganizationId]) => loadedOrganizationId !== action.payload.organizationId),
    map(([action, loaded]) => action),
    mergeMap(action =>
      this.userService.getUsers(action.payload.organizationId).pipe(
        map(dtos => ({
          organizationId: action.payload.organizationId,
          users: dtos.map(dto => UserConverter.fromDto(dto)),
        })),
        map(({organizationId, users}) => new UsersAction.GetSuccess({organizationId, users})),
        catchError(error => of(new UsersAction.GetFailure({error: error})))
      )
    )
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.GetFailure>(UsersActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'users.get.fail', value: 'Could not get users'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getCurrentUser$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.GetCurrentUser>(UsersActionType.GET_CURRENT_USER),
    tap(() => this.store$.dispatch(new UsersAction.SetPending({pending: true}))),
    mergeMap(() =>
      this.userService.getCurrentUser().pipe(
        map(user => UserConverter.fromDto(user)),
        mergeMap(user => [new UsersAction.GetCurrentUserSuccess({user}), new UsersAction.SetPending({pending: false})]),
        catchError(() => {
          const message = this.i18n({id: 'currentUser.get.fail', value: 'Could not get user details'});
          return from([new UsersAction.SetPending({pending: false}), new NotificationsAction.Error({message})]);
        })
      )
    )
  );

  @Effect()
  public patchCurrentUser$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.PatchCurrentUser>(UsersActionType.PATCH_CURRENT_USER),
    mergeMap(action => {
      const dto = UserConverter.toDto(action.payload.user);
      return this.userService.patchCurrentUser(dto).pipe(
        map(user => UserConverter.fromDto(user)),
        mergeMap(user => {
          const actions: Action[] = [new UsersAction.GetCurrentUserSuccess({user})];
          if (action.payload.onSuccess) {
            actions.push(new CommonAction.ExecuteCallback({callback: action.payload.onSuccess}));
          }
          return actions;
        }),
        catchError(() => {
          if (action.payload.onFailure) {
            action.payload.onFailure();
          }

          const message = this.i18n({id: 'currentUser.patch.fail', value: 'Could not update user details'});
          return of(new NotificationsAction.Error({message}));
        })
      );
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Create>(UsersActionType.CREATE),
    mergeMap(action => {
      const userDto = UserConverter.toDto(action.payload.user);

      return this.userService.createUser(action.payload.organizationId, userDto).pipe(
        map(dto => UserConverter.fromDto(dto)),
        map(user => new UsersAction.CreateSuccess({user: user})),
        catchError(error => of(new UsersAction.CreateFailure({error, organizationId: action.payload.organizationId})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.CreateFailure>(UsersActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.select(selectOrganizationsDictionary)),
    map(([action, organizations]) => {
      const organization = organizations[action.payload.organizationId];
      if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'user.create.serviceLimits',
          value:
            'You are currently on the Free plan which allows you to invite only three users to your organization. Do you want to upgrade to Business now?',
        });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', organization.code, 'detail'],
            extras: {fragment: 'orderService'},
          }),
          yesFirst: true,
        });
      }
      const errorMessage = this.i18n({id: 'user.create.fail', value: 'Could not add the user'});
      return new NotificationsAction.Error({message: errorMessage});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Update>(UsersActionType.UPDATE),
    mergeMap(action => {
      const userDto = UserConverter.toDto(action.payload.user);

      return this.userService.updateUser(action.payload.organizationId, userDto.id, userDto).pipe(
        map(dto => UserConverter.fromDto(dto)),
        map(user => new UsersAction.UpdateSuccess({user: user})),
        catchError(error => of(new UsersAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.UpdateFailure>(UsersActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'user.update.fail', value: 'Could not update the user'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.Delete>(UsersActionType.DELETE),
    mergeMap(action =>
      this.userService.deleteUser(action.payload.organizationId, action.payload.userId).pipe(
        map(() => new UsersAction.DeleteSuccess(action.payload)),
        catchError(error => of(new UsersAction.DeleteFailure({error: error})))
      )
    )
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.DeleteFailure>(UsersActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'user.delete.fail', value: 'Could not delete the user'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public saveDefaultWorkspace$ = this.actions$.pipe(
    ofType<UsersAction.SaveDefaultWorkspace>(UsersActionType.SAVE_DEFAULT_WORKSPACE),
    concatMap(action => {
      const defaultWorkspaceDto = DefaultWorkspaceConverter.toDto(action.payload.defaultWorkspace);
      return this.userService.saveDefaultWorkspace(defaultWorkspaceDto).pipe(
        withLatestFrom(this.store$.select(selectCurrentUser)),
        map(
          ([result, user]) =>
            new UsersAction.SaveDefaultWorkspaceSuccess({
              user,
              defaultWorkspace: action.payload.defaultWorkspace,
            })
        ),
        catchError(error => of(new UsersAction.SaveDefaultWorkspaceFailure({error: error})))
      );
    })
  );

  @Effect()
  public saveDefaultWorkspaceFailure$: Observable<Action> = this.actions$.pipe(
    ofType<UsersAction.SaveDefaultWorkspaceFailure>(UsersActionType.SAVE_DEFAULT_WORKSPACE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'user.defaultWorkspace.save.fail', value: 'Could not save the default workspace'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private store$: Store<AppState>,
    private userService: UserService
  ) {}
}
