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
import {Store} from '@ngrx/store';
import {EMPTY, of} from 'rxjs';
import {catchError, concatMap, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {UserService} from '../../data-service';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationsDictionary} from '../organizations/organizations.state';
import {
  convertDefaultWorkspaceModelToDto,
  convertUserDtoToModel,
  convertUserHintsDtoToModel,
  convertUserHintsModelToDto,
  convertUserModelToDto,
  convertUserOnboardingDtoToModel,
  convertUserOnboardingModelToDto,
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
import {TeamsAction} from '../teams/teams.action';
import {convertUserInvitationToDto} from '../../dto/user-invitation.dto';

@Injectable()
export class UsersEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.Get>(UsersActionType.GET),
      withLatestFrom(this.store$.select(selectUsersLoadedForOrganization)),
      filter(
        ([action, loadedOrganizationId]) =>
          action.payload.force || loadedOrganizationId !== action.payload.organizationId
      ),
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
          mergeMap(user => [
            new UsersAction.GetCurrentUserSuccess({user}),
            new UsersAction.SetPending({pending: false}),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(() => {
            const message = $localize`:@@currentUser.get.fail:Could not get user details`;
            return of(
              ...createCallbackActions(action.payload.onFailure),
              new UsersAction.SetPending({pending: false}),
              new NotificationsAction.Error({message})
            );
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
          mergeMap(() => [...createCallbackActions(action.payload.onSuccess)]),
          catchError(() => {
            const message = $localize`:@@currentUser.resendVerificationEmail.fail:Could not request another verification email`;
            return of(...createCallbackActions(action.payload.onFailure), new NotificationsAction.Error({message}));
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
        const invitationsDto = action.payload.invitations.map(user => convertUserInvitationToDto(user));

        return this.userService
          .createUsersInWorkspace(action.payload.organizationId, action.payload.projectId, invitationsDto)
          .pipe(
            map(dtos => dtos.map(dto => convertUserDtoToModel(dto))),
            mergeMap(users => [
              new UsersAction.InviteSuccess({users}),
              ...createCallbackActions(action.payload.onSuccess),
            ]),
            catchError(error =>
              of(
                new UsersAction.InviteFailure({
                  error,
                  organizationId: action.payload.organizationId,
                  projectId: action.payload.projectId,
                }),
                ...createCallbackActions(action.payload.onFailure)
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
          mergeMap(() => [
            new UsersAction.DeleteSuccess(action.payload),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
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

  public setTeams$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.SetTeams>(UsersActionType.SET_TEAMS),
      mergeMap(action => {
        return this.userService
          .setTeams(action.payload.organizationId, action.payload.user.id, action.payload.teams)
          .pipe(
            map(() => new TeamsAction.Get({organizationId: action.payload.organizationId})),
            catchError(error => of(new UsersAction.SetTeamsFailure({error})))
          );
      })
    )
  );

  public setTeamsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.SetTeamsFailure>(UsersActionType.SET_TEAMS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@user.teams.set.fail:Could not set user teams`;
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

  public updateHints$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.UpdateHints>(UsersActionType.UPDATE_HINTS),
      withLatestFrom(this.store$.select(selectCurrentUser)),
      mergeMap(([action, user]) => {
        return this.userService.updateHints(convertUserHintsModelToDto(action.payload.hints)).pipe(
          map(dto => convertUserHintsDtoToModel(dto)),
          map(hints => new UsersAction.UpdateHintsSuccess({hints})),
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

  public bookProductDemo$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.BookProductDemo>(UsersActionType.BOOK_PRODUCT_DEMO),
      mergeMap(action => {
        return this.userService.scheduleDemo(action.payload.message).pipe(
          mergeMap(() => [
            new UsersAction.BookProductDemoSuccess(),
            ...createCallbackActions(action.payload.onSuccess),
          ]),
          catchError(error =>
            of(new UsersAction.BookProductDemoFailure({error}), ...createCallbackActions(action.payload.onFailure))
          )
        );
      })
    )
  );

  public bookProductDemoSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.BookProductDemoSuccess>(UsersActionType.BOOK_PRODUCT_DEMO_SUCCESS),
      tap(() => {
        if (this.configurationService.getConfiguration().analytics) {
          this.angulartics2.eventTrack.next({
            action: 'Demo scheduled',
            properties: {
              category: 'ProductDemo',
            },
          });

          if (this.configurationService.getConfiguration().mixpanelKey) {
            mixpanel.track('Demo scheduled');
          }
        }
      }),
      map(() => {
        const message = $localize`:@@dialog.productDemo.success:We received your request and will get back to you soon.`;
        return new NotificationsAction.Success({message});
      })
    )
  );

  public bookProductDemoFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.BookProductDemoFailure>(UsersActionType.BOOK_PRODUCT_DEMO_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@dialog.productDemo.error:Could not schedule product demo.`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public getInTouch$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetInTouch>(UsersActionType.GET_IN_TOUCH),
      mergeMap(action => {
        return this.userService.sendFeedback(action.payload.message).pipe(
          mergeMap(() => [new UsersAction.GetInTouchSuccess(), ...createCallbackActions(action.payload.onSuccess)]),
          catchError(error =>
            of(new UsersAction.GetInTouchFailure({error}), ...createCallbackActions(action.payload.onFailure))
          )
        );
      })
    )
  );

  public getInTouchSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetInTouchSuccess>(UsersActionType.GET_IN_TOUCH_SUCCESS),
      tap(() => {
        if (this.configurationService.getConfiguration().analytics) {
          this.angulartics2.eventTrack.next({
            action: 'Feedback send',
            properties: {
              category: 'Feedback',
            },
          });

          if (this.configurationService.getConfiguration().mixpanelKey) {
            mixpanel.track('Feedback Send');
          }
        }
      }),
      map(() => {
        const message = $localize`:@@dialog.getInTouch.success:Your message has been sent.`;
        return new NotificationsAction.Success({message});
      })
    )
  );

  public getInTouchFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.GetInTouchFailure>(UsersActionType.GET_IN_TOUCH_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@dialog.getInTouch.error:Could not send your message.`;
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

  public setOnboarding$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.SetOnboarding>(UsersActionType.SET_ONBOARDING),
      withLatestFrom(this.store$.select(selectCurrentUser)),
      mergeMap(([action, user]) => {
        const model = {...user.onboarding, [action.payload.key]: action.payload.value};
        const dto = convertUserOnboardingModelToDto(model);

        return this.userService.updateOnboarding(dto).pipe(
          map(dto => convertUserOnboardingDtoToModel(dto)),
          map(onboarding => new UsersAction.SetOnboardingSuccess({onboarding})),
          catchError(() => EMPTY)
        );
      })
    )
  );

  public logEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType<UsersAction.LogEvent>(UsersActionType.LOG_EVENT),
      mergeMap(action => this.userService.logEvent(action.payload.event)),
      mergeMap(() => [])
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
