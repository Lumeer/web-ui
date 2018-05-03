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
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, map, mergeMap, skipWhile, tap, withLatestFrom} from 'rxjs/operators';
import {LinkInstanceService} from '../../rest';
import {AppState} from '../app.state';
import {QueryHelper} from '../navigation/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {LinkInstanceConverter} from './link-instance.converter';
import {LinkInstancesAction, LinkInstancesActionType} from './link-instances.action';
import {selectLinkInstancesQueries} from './link-instances.state';

@Injectable()
export class LinkInstancesEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.Get>(LinkInstancesActionType.GET),
    withLatestFrom(this.store$.select(selectLinkInstancesQueries)),
    skipWhile(([action, queries]) => queries.some(query => QueryHelper.equal(query, action.payload.query))),
    mergeMap(([action]) => this.linkInstanceService.getLinkInstances(action.payload.query).pipe(
      map(dtos => ({action, linkInstances: dtos.map(dto => LinkInstanceConverter.fromDto(dto))})),
      map(({action, linkInstances}) => new LinkInstancesAction.GetSuccess({linkInstances: linkInstances, query: action.payload.query})),
      catchError((error) => Observable.of(new LinkInstancesAction.GetFailure({error: error})))
    ))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.GetFailure>(LinkInstancesActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.instances.get.fail', value: 'Failed to get links'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.Create>(LinkInstancesActionType.CREATE),
    mergeMap(action => {
      const linkInstanceDto = LinkInstanceConverter.toDto(action.payload.linkInstance);

      return this.linkInstanceService.createLinkInstance(linkInstanceDto).pipe(
        map(dto => ({action, linkInstance: LinkInstanceConverter.fromDto(dto)})),
        tap(({action, linkInstance}) => {
          const callback = action.payload.callback;
          if (callback) {
            callback(linkInstance.id);
          }
        }),
        map(({linkInstance}) => new LinkInstancesAction.CreateSuccess({linkInstance})),
        catchError((error) => Observable.of(new LinkInstancesAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.CreateFailure>(LinkInstancesActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.instance.create.fail', value: 'Failed to create link'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.Update>(LinkInstancesActionType.UPDATE),
    mergeMap(action => {
      const linkInstanceDto = LinkInstanceConverter.toDto(action.payload.linkInstance);

      return this.linkInstanceService.updateLinkInstance(action.payload.linkInstance.id, linkInstanceDto).pipe(
        map(dto => LinkInstanceConverter.fromDto(dto)),
        map(linkInstance => new LinkInstancesAction.UpdateSuccess({linkInstance: linkInstance})),
        catchError((error) => Observable.of(new LinkInstancesAction.UpdateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.UpdateFailure>(LinkInstancesActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.instance.update.fail', value: 'Failed to update link'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.Delete>(LinkInstancesActionType.DELETE),
    mergeMap(action => this.linkInstanceService.deleteLinkInstance(action.payload.linkInstanceId).pipe(
      map(() => action),
      tap(action => {
        const callback = action.payload.callback;
        if (callback) {
          callback(action.payload.linkInstanceId);
        }
      }),
      map(action => new LinkInstancesAction.DeleteSuccess({linkInstanceId: action.payload.linkInstanceId})),
      catchError((error) => Observable.of(new LinkInstancesAction.DeleteFailure({error: error})))
    ))
  );

  @Effect()
  public deleteConfirm$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.DeleteConfirm>(LinkInstancesActionType.DELETE_CONFIRM),
    map((action: LinkInstancesAction.DeleteConfirm) => {
      const title = this.i18n({id: 'link.instance.delete.dialog.title', value: 'Delete link'});
      const message = this.i18n({id: 'link.instance.delete.dialog.message', value: 'Do you really want to delete link between records?'});

      return new NotificationsAction.Confirm({
        title,
        message,
        action: new LinkInstancesAction.Delete(action.payload)
      });
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkInstancesAction.DeleteFailure>(LinkInstancesActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.instance.delete.fail', value: 'Failed to delete link'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private linkInstanceService: LinkInstanceService,
              private store$: Store<AppState>) {
  }

}
