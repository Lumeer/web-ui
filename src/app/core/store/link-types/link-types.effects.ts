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

import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {LinkTypeService} from '../../rest';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {NotificationsAction} from '../notifications/notifications.action';
import {LinkTypeConverter} from './link-type.converter';
import {LinkTypesAction, LinkTypesActionType} from './link-types.action';
import {selectLinkTypesLoaded} from './link-types.state';

@Injectable()
export class LinkTypesEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Get>(LinkTypesActionType.GET),
    withLatestFrom(this.store$.select(selectLinkTypesLoaded)),
    filter(([action, loaded]) => !loaded),
    mergeMap(() => {
      return this.linkTypeService.getLinkTypes().pipe(
        map(dtos => dtos.map(dto => LinkTypeConverter.fromDto(dto))),
        map(linkTypes => new LinkTypesAction.GetSuccess({linkTypes: linkTypes})),
        catchError(error => of(new LinkTypesAction.GetFailure({error: error})))
      );
    })
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.GetFailure>(LinkTypesActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.types.get.fail', value: 'Could not get link types'});
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
        catchError(error => of(new LinkTypesAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.CreateFailure>(LinkTypesActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.type.create.fail', value: 'Could not create the link type'});
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
        catchError(error => of(new LinkTypesAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.UpdateFailure>(LinkTypesActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.type.update.fail', value: 'Could not update the link type'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Delete>(LinkTypesActionType.DELETE),
    mergeMap(action =>
      this.linkTypeService.deleteLinkType(action.payload.linkTypeId).pipe(
        map(linkTypeId => new LinkTypesAction.DeleteSuccess({linkTypeId: linkTypeId})),
        catchError(error => of(new LinkTypesAction.DeleteFailure({error: error})))
      )
    )
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.DeleteFailure>(LinkTypesActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'link.type.delete.fail', value: 'Could not delete the link type'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private linkTypeService: LinkTypeService,
    private store$: Store<AppState>
  ) {}
}
