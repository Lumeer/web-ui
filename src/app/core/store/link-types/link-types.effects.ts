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
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {LinkTypeService} from '../../rest';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {QueryConverter} from '../navigation/query.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {LinkTypeConverter} from './link-type.converter';
import {LinkTypesAction, LinkTypesActionType} from './link-types.action';

@Injectable()
export class LinkTypesEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Get>(LinkTypesActionType.GET),
    mergeMap((action) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.linkTypeService.getLinkTypes(queryDto).pipe(
        map(dtos => ({action, linkTypes: dtos.map(dto => LinkTypeConverter.fromDto(dto))})),
        mergeMap(({action, linkTypes}) => {
          const actions: Action[] = [new LinkTypesAction.GetSuccess({linkTypes: linkTypes, query: action.payload.query})];
          if (action.payload.loadInstances) {
            actions.push(new LinkInstancesAction.Get({query: action.payload.query}));
          }
          return actions;
        }),
        catchError((error) => Observable.of(new LinkTypesAction.GetFailure({error: error})))
      );
    }),
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.GetFailure>(LinkTypesActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.types.get.fail', value: 'Failed to get link types'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Create>(LinkTypesActionType.CREATE),
    mergeMap(action => {
      const linkTypeDto = LinkTypeConverter.toDto(action.payload.linkType);

      return this.linkTypeService.createLinkType(linkTypeDto).pipe(
        map(dto => LinkTypeConverter.fromDto(dto, action.payload.linkType.correlationId)),
        mergeMap(linkType => {
          const actions: Action[] = [new LinkTypesAction.CreateSuccess({linkType: linkType})];

          const {callback} = action.payload;
          if (callback) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => callback(linkType)}));
          }

          return actions;
        }),
        catchError((error) => Observable.of(new LinkTypesAction.CreateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.CreateFailure>(LinkTypesActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.type.create.fail', value: 'Failed to create link type'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Update>(LinkTypesActionType.UPDATE),
    mergeMap(action => {
      const linkTypeDto = LinkTypeConverter.toDto(action.payload.linkType);

      return this.linkTypeService.updateLinkType(action.payload.linkType.id, linkTypeDto).pipe(
        map(dto => LinkTypeConverter.fromDto(dto)),
        map(linkType => new LinkTypesAction.UpdateSuccess({linkType: linkType})),
        catchError((error) => Observable.of(new LinkTypesAction.UpdateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.UpdateFailure>(LinkTypesActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.type.update.fail', value: 'Failed to update link type'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Delete>(LinkTypesActionType.DELETE),
    mergeMap(action => this.linkTypeService.deleteLinkType(action.payload.linkTypeId).pipe(
      map(linkTypeId => new LinkTypesAction.DeleteSuccess({linkTypeId: linkTypeId})),
      catchError((error) => Observable.of(new LinkTypesAction.DeleteFailure({error: error})))
    ))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.DeleteFailure>(LinkTypesActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.type.delete.fail', value: 'Failed to delete link type'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private linkTypeService: LinkTypeService,
              private store$: Store<AppState>) {
  }

}
