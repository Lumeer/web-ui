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

import {EMPTY, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {NotificationsAction} from '../notifications/notifications.action';
import {convertTeamDtoToModel, convertTeamModelToDto} from './teams.converter';
import {TeamsAction, TeamsActionType} from './teams.action';
import {AppState} from '../app.state';
import {select, Store} from '@ngrx/store';
import {selectTeamsDictionary, selectTeamsLoaded} from './teams.state';
import {TeamService} from '../../data-service/team/team.service';

@Injectable()
export class TeamsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.Get>(TeamsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectTeamsLoaded))),
      filter(([action, teamsLoaded]) => action.payload.force || !teamsLoaded[action.payload.organizationId]),
      mergeMap(([action]) =>
        this.teamService.getAll(action.payload.organizationId).pipe(
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

        return this.teamService.create(groupDto).pipe(
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
      withLatestFrom(this.store$.pipe(select(selectTeamsDictionary))),
      mergeMap(([action, teamsMap]) => {
        const teamDto = convertTeamModelToDto(action.payload.team);
        const originalTeam = teamsMap[action.payload.team.id];
        this.store$.dispatch(new TeamsAction.UpdateSuccess({team: action.payload.team}));

        return this.teamService.update(teamDto.id, teamDto).pipe(
          mergeMap(() => EMPTY),
          catchError(error =>
            of(new TeamsAction.UpdateFailure({error}), new TeamsAction.UpdateSuccess({team: originalTeam}))
          )
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.UpdateFailure>(TeamsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@team.update.fail:Could not update the team`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<TeamsAction.Delete>(TeamsActionType.DELETE),
      mergeMap(action =>
        this.teamService.delete(action.payload.teamId).pipe(
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
        const message = $localize`:@@team.delete.fail:Could not delete the team`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(private actions$: Actions, private teamService: TeamService, private store$: Store<AppState>) {}
}
