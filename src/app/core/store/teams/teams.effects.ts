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
import {TeamService} from '../../rest';
import {NotificationsAction} from '../notifications/notifications.action';
import {convertTeamDtoToModel, convertTeamModelToDto} from './teams.converter';
import {TeamsAction, TeamsActionType} from './teams.action';

@Injectable()
export class TeamsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.Get>(TeamsActionType.GET),
      mergeMap(action =>
        this.groupService.getGroups(action.payload.organizationId).pipe(
          map(dtos => dtos.map(dto => convertTeamDtoToModel(dto))),
          map(teams => new TeamsAction.GetSuccess({teams, organizationId: action.payload.organizationId})),
          catchError(error => of(new TeamsAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.GetFailure>(TeamsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@groups.get.fail:Could not get groups`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.Create>(TeamsActionType.CREATE),
      mergeMap(action => {
        const groupDto = convertTeamModelToDto(action.payload.team);

        return this.groupService.createTeam(groupDto).pipe(
          map(dto => convertTeamDtoToModel(dto)),
          map(team => new TeamsAction.CreateSuccess({team})),
          catchError(error => of(new TeamsAction.CreateFailure({error})))
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.CreateFailure>(TeamsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@group.create.fail:Could not create the group`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.Update>(TeamsActionType.UPDATE),
      mergeMap(action => {
        const groupDto = convertTeamModelToDto(action.payload.team);

        return this.groupService.updateGroup(groupDto.id, groupDto).pipe(
          map(dto => convertTeamDtoToModel(dto)),
          map(team => new TeamsAction.UpdateSuccess({team})),
          catchError(error => of(new TeamsAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.UpdateFailure>(TeamsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@group.update.fail:Could not update the group`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.Delete>(TeamsActionType.DELETE),
      mergeMap(action =>
        this.groupService.deleteGroup(action.payload.teamId).pipe(
          map(() => new TeamsAction.DeleteSuccess(action.payload)),
          catchError(error => of(new TeamsAction.DeleteFailure({error})))
        )
      )
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.DeleteFailure>(TeamsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@group.delete.fail:Could not delete the group`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(private actions$: Actions, private groupService: TeamService) {}
}
