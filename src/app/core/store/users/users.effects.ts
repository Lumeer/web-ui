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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {EMPTY, from, of} from 'rxjs';
import {catchError, concatMap, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {UserService} from '../../data-service';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary} from '../organizations/organizations.state';
import {
  convertDefaultWorkspaceModelToDto,
  convertNotificationsToDto,
  convertUserDtoToModel,
  convertUserHintsDtoToModel,
  convertUserHintsModelToDto,
  convertUserModelToDto,
} from './user.converter';
import {UsersAction, UsersActionType} from './users.action';
import {selectCurrentUser, selectUsersLoadedForOrganization} from './users.state';
import {Angulartics2} from 'angulartics2';
import mixpanel from 'mixpanel-browser';
import {OrganizationsAction} from '../organizations/organizations.action';
import {isNullOrUndefined} from '../../../shared/utils/common.utils';
import {createCallbackActions} from '../utils/store.utils';
import {selectAllServiceLimits} from '../organizations/service-limits/service-limits.state';
import {ServiceLevelType} from '../../dto/service-level-type';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class UsersEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.Get>(UsersActionType.GET),
      withLatestFrom(this.store$.select(selectUsersLoadedForOrganization)),
      filter(([action, loadedOrganizationId]) => loadedOrganizationId !== action.payload.organizationId),
      map(([action]) => action),
      mergeMap(action =>
        this.userService.getUsers(action.payload.organizationId).pipe(
          map(dtos => ({
            organizationId: action.payload.organizationId,
            users: dtos.map(dto => convertUserDtoToModel(dto)),
          })),
          map(({organizationId, users}) => new UsersAction.GetSuccess({organizationId, users})),
          catchError(error => of(new UsersAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetFailure>(UsersActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@users.get.fail:Could not get users`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetCurrentUser>(UsersActionType.GET_CURRENT_USER),
      tap(() => this.store$.dispatch(new UsersAction.SetPending({pending: true}))),
      mergeMap(action =>
        this.userService.getCurrentUser().pipe(
          map(user => convertUserDtoToModel(user)),
          mergeMap(user => {
            const actions: Action[] = [
              new UsersAction.GetCurrentUserSuccess({user}),
              new UsersAction.SetPending({pending: false}),
            ];
            if (action.payload?.onSuccess) {
              actions.push(new CommonAction.ExecuteCallback({callback: action.payload.onSuccess}));
            }
            return actions;
          }),
          catchError(() => {
            if (action.payload?.onFailure) {
              action.payload.onFailure();
            }

            const message = $localize`:@@currentUser.get.fail:Could not get user details`;
            return from([new UsersAction.SetPending({pending: false}), new NotificationsAction.Error({message})]);
          })
        )
      )
    )
  );

  public resendVerificationEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.ResendVerificationEmail>(UsersActionType.RESEND_VERIFICATION_EMAIL),
      mergeMap(action =>
        this.userService.resendVerificationEmail().pipe(
          mergeMap(() => {
            const actions: Action[] = [];
            if (action.payload?.onSuccess) {
              actions.push(new CommonAction.ExecuteCallback({callback: action.payload.onSuccess}));
            }
            return actions;
          }),
          catchError(() => {
            if (action.payload?.onFailure) {
              action.payload.onFailure();
            }

            const message = $localize`:@@currentUser.resendVerificationEmail.fail:Could not request another verification email`;
            return from([new NotificationsAction.Error({message})]);
          })
        )
      )
    )
  );

  public getCurrentUserWithLastLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetCurrentUserWithLastLogin>(UsersActionType.GET_CURRENT_USER_WITH_LAST_LOGIN),
      tap(() => this.store$.dispatch(new UsersAction.SetPending({pending: true}))),
      mergeMap(() =>
        this.userService.getCurrentUserWithLastLogin().pipe(
          map(user => convertUserDtoToModel(user)),
          mergeMap(user => [
            new UsersAction.GetCurrentUserSuccess({user}),
            new UsersAction.SetPending({pending: false}),
          ]),
          catchError(() => {
            const message = $localize`:@@currentUser.get.fail:Could not get user details`;
            return from([new UsersAction.SetPending({pending: false}), new NotificationsAction.Error({message})]);
          })
        )
      )
    )
  );

  public patchCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.PatchCurrentUser>(UsersActionType.PATCH_CURRENT_USER),
      mergeMap(action => {
        const dto = convertUserModelToDto(action.payload.user);
        return this.userService.patchCurrentUser(dto).pipe(
          map(user => convertUserDtoToModel(user)),
          mergeMap(user => [
            new UsersAction.GetCurrentUserSuccess({user}),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(() => {
            const message = $localize`:@@currentUser.patch.fail:Could not update user details`;
            return of(new NotificationsAction.Error({message}), ...createCallbackActions(action.payload.onFailure));
          })
        );
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.Create>(UsersActionType.CREATE),
      mergeMap(action => {
        const userDto = convertUserModelToDto(action.payload.user);

        return this.userService.createUser(action.payload.organizationId, userDto).pipe(
          map(dto => convertUserDtoToModel(dto)),
          map(user => new UsersAction.CreateSuccess({user: user})),
          catchError(error => of(new UsersAction.CreateFailure({error, organizationId: action.payload.organizationId})))
        );
      })
    )
  );

  public createSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<UsersAction.CreateSuccess>(UsersActionType.CREATE_SUCCESS),
        tap((action: UsersAction.CreateSuccess) => {
          if (this.configurationService.getConfiguration().analytics) {
            this.angulartics2.eventTrack.next({
              action: 'User add',
              properties: {
                category: 'Collaboration',
              },
            });

            if (this.configurationService.getConfiguration().mixpanelKey) {
              mixpanel.track('User Create', {user: action.payload.user.email});
            }
          }
        })
      ),
    {dispatch: false}
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.CreateFailure>(UsersActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(action => {
        if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
          return new UsersAction.InvitationExceeded(action.payload);
        }
        const errorMessage = $localize`:@@user.create.fail:Could not add the user`;
        return new NotificationsAction.Error({message: errorMessage});
      })
    )
  );

  public invitationExceeded$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.InvitationExceeded>(UsersActionType.INVITATION_EXCEEDED),
      withLatestFrom(this.store$.select(selectOrganizationsDictionary), this.store$.select(selectAllServiceLimits)),
      map(([action, organizations, serviceLimits]) => {
        const organization = organizations[action.payload.organizationId];
        const limits = serviceLimits.find(limit => limit.organizationId === action.payload.organizationId);
        let message: string;
        let title: string;
        if (limits?.serviceLevel === ServiceLevelType.BASIC) {
          message = $localize`:@@user.create.serviceLimits.basic:You are allowed to invite only ${limits.users}:limit: users to your organization. Do you want to upgrade your plan now?`;
          title = $localize`:@@user.create.serviceLimits.business.title:Limits exceeded`;
        } else {
          message = $localize`:@@user.create.serviceLimits:You are currently on the Free plan which allows you to invite only three users to your organization. Do you want to upgrade to Business now?`;
        }

        return new OrganizationsAction.OfferPayment({message, title, organizationCode: organization.code});
      })
    )
  );

  public invite$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.InviteUsers>(UsersActionType.INVITE),
      mergeMap(action => {
        const usersDto = action.payload.users.map(user => convertUserModelToDto(user));

        return this.userService
          .createUserInWorkspace(
            action.payload.organizationId,
            action.payload.projectId,
            usersDto,
            action.payload.invitationType
          )
          .pipe(
            map(dtos => dtos.map(dto => convertUserDtoToModel(dto))),
            map(users => new UsersAction.InviteSuccess({users})),
            catchError(error =>
              of(
                new UsersAction.InviteFailure({
                  error,
                  organizationId: action.payload.organizationId,
                  projectId: action.payload.projectId,
                })
              )
            )
          );
      })
    )
  );

  public inviteSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<UsersAction.InviteSuccess>(UsersActionType.INVITE_SUCCESS),
        tap((action: UsersAction.InviteSuccess) => {
          if (this.configurationService.getConfiguration().analytics) {
            this.angulartics2.eventTrack.next({
              action: 'User add',
              properties: {
                category: 'Collaboration',
              },
            });

            if (this.configurationService.getConfiguration().mixpanelKey) {
              action.payload.users.forEach(user => mixpanel.track('User Create', {user: user.email}));
            }
          }
        })
      ),
    {dispatch: false}
  );

  public inviteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.InviteFailure>(UsersActionType.INVITE_FAILURE),
      map(
        action =>
          new UsersAction.CreateFailure({organizationId: action.payload.organizationId, error: action.payload.error})
      )
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.Update>(UsersActionType.UPDATE),
      mergeMap(action => {
        const userDto = convertUserModelToDto(action.payload.user);

        return this.userService.updateUser(action.payload.organizationId, userDto.id, userDto).pipe(
          map(dto => convertUserDtoToModel(dto)),
          map(user => new UsersAction.UpdateSuccess({user: user})),
          catchError(error => of(new UsersAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.UpdateFailure>(UsersActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@user.update.fail:Could not update the user`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.Delete>(UsersActionType.DELETE),
      mergeMap(action =>
        this.userService.deleteUser(action.payload.organizationId, action.payload.userId).pipe(
          map(() => new UsersAction.DeleteSuccess(action.payload)),
          catchError(error => of(new UsersAction.DeleteFailure({error})))
        )
      )
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.DeleteFailure>(UsersActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@user.delete.fail:Could not delete the user`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public saveDefaultWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.SaveDefaultWorkspace>(UsersActionType.SAVE_DEFAULT_WORKSPACE),
      concatMap(action => {
        const defaultWorkspaceDto = convertDefaultWorkspaceModelToDto(action.payload.defaultWorkspace);
        return this.userService.saveDefaultWorkspace(defaultWorkspaceDto).pipe(
          withLatestFrom(this.store$.select(selectCurrentUser)),
          map(
            ([, user]) =>
              new UsersAction.SaveDefaultWorkspaceSuccess({
                user,
                defaultWorkspace: action.payload.defaultWorkspace,
              })
          ),
          catchError(error => of(new UsersAction.SaveDefaultWorkspaceFailure({error})))
        );
      })
    )
  );

  public saveDefaultWorkspaceFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.SaveDefaultWorkspaceFailure>(UsersActionType.SAVE_DEFAULT_WORKSPACE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@user.defaultWorkspace.save.fail:Could not save the default workspace`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public referrals$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.Referrals>(UsersActionType.REFERRALS),
      mergeMap(action => {
        return this.userService.getUserReferrals().pipe(
          map(paymentStats => new UsersAction.ReferralsSuccess({referrals: paymentStats})),
          catchError(error => of(new UsersAction.ReferralsFailure({error})))
        );
      })
    )
  );

  public referralsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.ReferralsFailure>(UsersActionType.REFERRALS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@user.referrals.fail:Could not get your referrals at the moment`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getHints$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetHints>(UsersActionType.GET_HINTS),
      mergeMap(() => {
        return this.userService.getHints().pipe(
          map(dto => convertUserHintsDtoToModel(dto)),
          map(hints => new UsersAction.GetHintsSuccess({hints})),
          catchError(error => of(new UsersAction.GetHintsFailure({error})))
        );
      })
    )
  );

  public getHintsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetHintsFailure>(UsersActionType.GET_HINTS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@currentUser.get.fail:Could not get user details`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public updateHints$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.UpdateHints>(UsersActionType.UPDATE_HINTS),
      withLatestFrom(this.store$.select(selectCurrentUser)),
      mergeMap(([action, user]) => {
        return this.userService.updateHints(convertUserHintsModelToDto(action.payload.hints)).pipe(
          map(dto => convertUserHintsDtoToModel(dto)),
          map(hints => new UsersAction.UpdateHintsSuccess({hints: hints})),
          catchError(error => of(new UsersAction.UpdateHintsFailure({error, originalHints: {...user.hints}})))
        );
      })
    )
  );

  public updateHintsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.UpdateHintsFailure>(UsersActionType.UPDATE_HINTS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@user.update.fail:Could not update the user`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public setHint$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.SetHint>(UsersActionType.SET_HINT),
      withLatestFrom(this.store$.select(selectCurrentUser)),
      mergeMap(([action, user]) => {
        if (isNullOrUndefined(user.hints) || user.hints[action.payload.hint] !== action.payload.value) {
          return of(new UsersAction.UpdateHints({hints: {...user.hints, [action.payload.hint]: action.payload.value}}));
        } else {
          return EMPTY;
        }
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private userService: UserService,
    private angulartics2: Angulartics2,
    private configurationService: ConfigurationService
  ) {}
}
