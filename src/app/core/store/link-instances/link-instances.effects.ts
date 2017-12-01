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
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, map, skipWhile, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {LinkInstanceService} from '../../rest/link-instance.service';
import {AppState} from '../app.state';
import {QueryHelper} from '../navigation/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {LinkInstanceConverter} from './link-instance.converter';
import {LinkInstanceModel} from './link-instance.model';
import {LinkInstancesAction, LinkInstancesActionType} from './link-instances.action';
import {selectLinkInstancesQueries} from './link-instances.state';

@Injectable()
export class LinkInstancesEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.Get>(LinkInstancesActionType.GET).pipe(
    withLatestFrom(this.store$.select(selectLinkInstancesQueries)),
    skipWhile(([action, queries]) => queries.some(query => QueryHelper.equal(query, action.payload.query))),
    switchMap(([action, queries]) => this.linkInstanceService.getLinkInstances(action.payload.query).pipe(
      map(dtos => [action, dtos.map(dto => LinkInstanceConverter.fromDto(dto))])
    )),
    map(([action, linkInstances]: [LinkInstancesAction.Get, LinkInstanceModel[]]) =>
      new LinkInstancesAction.GetSuccess({linkInstances: linkInstances, query: action.payload.query})),
    catchError((error) => Observable.of(new LinkInstancesAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.GetFailure>(LinkInstancesActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to get links'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.Create>(LinkInstancesActionType.CREATE).pipe(
    switchMap(action => {
      const linkInstanceDto = LinkInstanceConverter.toDto(action.payload.linkInstance);

      return this.linkInstanceService.createLinkInstance(linkInstanceDto).pipe(
        map(dto => LinkInstanceConverter.fromDto(dto))
      );
    }),
    map(linkInstance => new LinkInstancesAction.CreateSuccess({linkInstance: linkInstance})),
    catchError((error) => Observable.of(new LinkInstancesAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.CreateFailure>(LinkInstancesActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to link document'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.Update>(LinkInstancesActionType.UPDATE).pipe(
    switchMap(action => {
      const linkInstanceDto = LinkInstanceConverter.toDto(action.payload.linkInstance);

      return this.linkInstanceService.updateLinkInstance(action.payload.linkInstance.id, linkInstanceDto).pipe(
        map(dto => LinkInstanceConverter.fromDto(dto))
      );
    }),
    map(linkInstance => new LinkInstancesAction.UpdateSuccess({linkInstance: linkInstance})),
    catchError((error) => Observable.of(new LinkInstancesAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.UpdateFailure>(LinkInstancesActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to update link attributes'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.Delete>(LinkInstancesActionType.DELETE).pipe(
    switchMap(action => this.linkInstanceService.deleteLinkInstance(action.payload.linkInstanceId)),
    map(linkInstanceId => new LinkInstancesAction.DeleteSuccess({linkInstanceId: linkInstanceId})),
    catchError((error) => Observable.of(new LinkInstancesAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<LinkInstancesAction.DeleteFailure>(LinkInstancesActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to unlink document'}))
  );

  constructor(private actions$: Actions,
              private linkInstanceService: LinkInstanceService,
              private store$: Store<AppState>) {
  }

}
