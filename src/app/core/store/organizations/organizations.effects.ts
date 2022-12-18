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

import {EMPTY, Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {RouteFinder} from '../../../shared/utils/route-finder';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {RouterAction} from '../router/router.action';
import {OrganizationConverter} from './organization.converter';
import {OrganizationsAction, OrganizationsActionType} from './organizations.action';
import {selectOrganizationsDictionary, selectOrganizationsLoaded} from './organizations.state';
import {PermissionDto} from '../../dto';
import {Permission, PermissionType} from '../permissions/permissions';
import {convertPermissionModelToDto} from '../permissions/permissions.converter';
import {CommonAction} from '../common/common.action';
import {ServiceLimitsAction} from './service-limits/service-limits.action';
import {selectNavigation} from '../navigation/navigation.state';
import {OrganizationService} from '../../data-service';
import {ModalService} from '../../../shared/modal/modal.service';
import {convertServiceLimitsDtoToModel} from './service-limits/service-limits.converter';
import {ProjectsAction} from '../projects/projects.action';
import {ProjectConverter} from '../projects/project.converter';
import {convertTeamDtoToModel} from '../teams/teams.converter';
import {TeamsAction} from '../teams/teams.action';

@Injectable()
export class OrganizationsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GetAllWorkspaces>(OrganizationsActionType.GET_ALL_WORKSPACES),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsLoaded))),
      filter(([, loaded]) => !loaded),
      mergeMap(() =>
        this.organizationService.getAllWorkspaces().pipe(
          mergeMap(workspaces => {
            const organizations = workspaces.organizations.map(dto => OrganizationConverter.fromDto(dto));
            const serviceLimits = Object.keys(workspaces.limits).map(organizationId =>
              convertServiceLimitsDtoToModel(organizationId, workspaces.limits[organizationId])
            );
            const projectsByOrganizations = Object.keys(workspaces.projects).reduce(
              (data, organizationId) => ({
                ...data,
                [organizationId]: workspaces.projects[organizationId].map(dto =>
                  ProjectConverter.fromDto(dto, organizationId)
                ),
              }),
              {}
            );
            const teamsByOrganizations = Object.keys(workspaces.groups).reduce(
              (data, organizationId) => ({
                ...data,
                [organizationId]: workspaces.groups[organizationId].map(dto =>
                  convertTeamDtoToModel(dto, organizationId)
                ),
              }),
              {}
            );

            return [
              new TeamsAction.GetAllSuccess({teamsByOrganizations}),
              new ProjectsAction.GetAllSuccess({projectsByOrganizations}),
              new ServiceLimitsAction.GetAllSuccess({serviceLimits}),
              new OrganizationsAction.GetSuccess({organizations}),
            ];
          }),
          catchError(error => of(new OrganizationsAction.GetFailure({error})))
        )
      )
    )
  );

  public getOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GetOne>(OrganizationsActionType.GET_ONE),
      mergeMap(action =>
        this.organizationService.getOrganization(action.payload.organizationId).pipe(
          map(dto => OrganizationConverter.fromDto(dto)),
          map(organization => new OrganizationsAction.GetOneSuccess({organization})),
          catchError(error => of(new OrganizationsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GetFailure>(OrganizationsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organizations.get.fail:Could not get organizations`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Create>(OrganizationsActionType.CREATE),
      mergeMap(action => {
        const {organization, onSuccess, onFailure} = action.payload;
        const organizationDto = OrganizationConverter.toDto(action.payload.organization);

        return this.organizationService.createOrganization(organizationDto).pipe(
          map(dto => OrganizationConverter.fromDto(dto, organization.correlationId)),
          mergeMap(newOrganization => {
            const actions: Action[] = [
              new OrganizationsAction.CreateSuccess({organization: newOrganization}),
              new ServiceLimitsAction.GetServiceLimits({organizationId: newOrganization.id}),
            ];

            if (onSuccess) {
              actions.push(new CommonAction.ExecuteCallback({callback: () => onSuccess(newOrganization)}));
            }

            return actions;
          }),
          catchError(error => {
            const actions: Action[] = [new OrganizationsAction.CreateFailure({error})];
            if (onFailure) {
              actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure()}));
            }
            return of(...actions);
          })
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.CreateFailure>(OrganizationsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.create.fail:Could not create the organization`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Update>(OrganizationsActionType.UPDATE),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
      mergeMap(([action, organizationEntities]) => {
        const organizationDto = OrganizationConverter.toDto(action.payload.organization);
        const oldOrganization = organizationEntities[action.payload.organization.id];
        return this.organizationService.updateOrganization(action.payload.organization.id, organizationDto).pipe(
          map(dto => OrganizationConverter.fromDto(dto)),
          map(
            organization =>
              new OrganizationsAction.UpdateSuccess({
                organization: {...organization, id: organization.id},
                oldCode: oldOrganization.code,
              })
          ),
          catchError(error => of(new OrganizationsAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.UpdateSuccess>(OrganizationsActionType.UPDATE_SUCCESS),
      mergeMap(action => {
        const {organization, oldCode} = action.payload;

        const paramMap = RouteFinder.getFirstChildRouteWithParams(this.router.routerState.root.snapshot).paramMap;
        const orgCodeInRoute = paramMap.get('organizationCode');
        if (orgCodeInRoute && oldCode && orgCodeInRoute === oldCode && organization.code !== oldCode) {
          const paths = this.router.routerState.snapshot.url.split('/').filter(path => path);
          const index = paths.indexOf(oldCode, 1);
          if (index !== -1) {
            paths[index] = organization.code;
            return [new RouterAction.Go({path: paths})];
          }
        }
        return [];
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.UpdateFailure>(OrganizationsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.update.fail:Could not update the organization`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.Delete>(OrganizationsActionType.DELETE),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
      mergeMap(([action, organizationEntities]) => {
        const {organizationId} = action.payload;
        const organization = organizationEntities[organizationId];
        return this.organizationService.deleteOrganization(organizationId).pipe(
          map(() => new OrganizationsAction.DeleteSuccess({organizationId, organizationCode: organization.code})),
          catchError(error => of(new OrganizationsAction.DeleteFailure({error})))
        );
      })
    )
  );

  public deleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.DeleteSuccess>(OrganizationsActionType.DELETE_SUCCESS),
      withLatestFrom(this.store$.pipe(select(selectNavigation))),
      mergeMap(([action, navigation]) => {
        const {organizationCode} = action.payload;

        if (navigation && navigation.workspace && navigation.workspace.organizationCode === organizationCode) {
          return [new RouterAction.Go({path: ['/']})];
        }

        return [];
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.DeleteFailure>(OrganizationsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.delete.fail:Could not delete the organization`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public changePermission$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.ChangePermission>(OrganizationsActionType.CHANGE_PERMISSION),
      withLatestFrom(this.store$.pipe(select(selectOrganizationsDictionary))),
      mergeMap(([action, organizationsMap]) => {
        this.store$.dispatch(new OrganizationsAction.ChangePermissionSuccess(action.payload));

        const originalOrganization = organizationsMap[action.payload.organizationId];
        const dtos = action.payload.permissions.map(permission => convertPermissionModelToDto(permission));

        let observable: Observable<PermissionDto>;
        let currentPermissions: Permission[];
        if (action.payload.type === PermissionType.Users) {
          observable = this.organizationService.updateUserPermission(dtos);
          currentPermissions = originalOrganization.permissions?.users;
        } else {
          observable = this.organizationService.updateGroupPermission(dtos);
          currentPermissions = originalOrganization.permissions?.groups;
        }

        return observable.pipe(
          mergeMap(() => EMPTY),
          catchError(error => {
            const payload = {
              ...action.payload,
              permissions: currentPermissions,
              error,
            };
            return of(new OrganizationsAction.ChangePermissionFailure(payload));
          })
        );
      })
    )
  );

  public changePermissionFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.ChangePermissionFailure>(OrganizationsActionType.CHANGE_PERMISSION_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@organization.permission.change.fail:Could not change the organization permissions`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public offerPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.OfferPayment>(OrganizationsActionType.OFFER_PAYMENT),
      map(action => {
        const title = $localize`:@@serviceLimits.trial:Free Service`;
        const message = $localize`:@@project.create.serviceLimits:You are currently on the Free plan which allows you to have only one project. Do you want to upgrade to Business now?`;
        return new NotificationsAction.Confirm({
          title: action.payload.title || title,
          message: action.payload.message || message,
          action: new OrganizationsAction.GoToPayment({code: action.payload.organizationCode}),
          type: 'warning',
          yesFirst: false,
        });
      })
    )
  );

  public goToPayment$ = createEffect(() =>
    this.actions$.pipe(
      ofType<OrganizationsAction.GoToPayment>(OrganizationsActionType.GO_TO_PAYMENT),
      map(action => {
        return new RouterAction.Go({
          path: ['/o', action.payload.code, 'detail'],
          extras: {fragment: 'orderService'},
        });
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private modalService: ModalService,
    private organizationService: OrganizationService
  ) {}
}
