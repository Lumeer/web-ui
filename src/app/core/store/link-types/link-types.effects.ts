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

import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, of} from 'rxjs';
import {catchError, filter, flatMap, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {LinkTypeDto} from '../../dto';
import {LinkTypeService} from '../../rest';
import {AppState} from '../app.state';
import {convertAttributeDtoToModel, convertAttributeModelToDto} from '../collections/attribute.converter';
import {CommonAction} from '../common/common.action';
import {LinkInstancesAction, LinkInstancesActionType} from '../link-instances/link-instances.action';
import {selectQuery} from '../navigation/navigation.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {createCallbackActions, emitErrorActions} from '../store.utils';
import {convertLinkTypeDtoToModel, convertLinkTypeModelToDto} from './link-type.converter';
import {LinkTypesAction, LinkTypesActionType} from './link-types.action';
import {selectLinkTypeAttributeById, selectLinkTypesLoaded} from './link-types.state';

@Injectable()
export class LinkTypesEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.Get>(LinkTypesActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectLinkTypesLoaded))),
    filter(([action, loaded]) => action.payload.force || !loaded),
    map(([action]) => action),
    mergeMap(action => {
      return this.linkTypeService.getLinkTypes(action.payload.workspace).pipe(
        map(dtos => dtos.map(dto => convertLinkTypeDtoToModel(dto))),
        map(linkTypes => new LinkTypesAction.GetSuccess({linkTypes: linkTypes})),
        catchError(error => of(new LinkTypesAction.GetFailure({error: error})))
      );
    })
  );

  @Effect()
  public getSingle$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.GetSingle>(LinkTypesActionType.GET_SINGLE),
    mergeMap(action => {
      return this.linkTypeService.getLinkType(action.payload.linkTypeId).pipe(
        map((dto: LinkTypeDto) => convertLinkTypeDtoToModel(dto)),
        map(linkType => new LinkTypesAction.GetSuccess({linkTypes: [linkType]})),
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
      const linkTypeDto = convertLinkTypeModelToDto(action.payload.linkType);

      return this.linkTypeService.createLinkType(linkTypeDto).pipe(
        map(dto => convertLinkTypeDtoToModel(dto, action.payload.linkType.correlationId)),
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
      const linkTypeDto = convertLinkTypeModelToDto(action.payload.linkType);

      return this.linkTypeService.updateLinkType(action.payload.linkType.id, linkTypeDto).pipe(
        map(dto => convertLinkTypeDtoToModel(dto)),
        map(linkType => new LinkTypesAction.UpdateSuccess({linkType})),
        catchError(error => of(new LinkTypesAction.UpdateFailure({error})))
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
  public deleteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.DeleteSuccess>(LinkInstancesActionType.DELETE_SUCCESS),
    withLatestFrom(this.store$.pipe(select(selectQuery))),
    flatMap(([action, query]) => {
      const {linkTypeId} = action.payload;
      const actions: Action[] = [new LinkInstancesAction.ClearByLinkType({linkTypeId})];

      return actions;
    })
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

  @Effect()
  public createAttributes$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.CreateAttributes>(LinkTypesActionType.CREATE_ATTRIBUTES),
    mergeMap(action => {
      const attributesDto = action.payload.attributes.map(attr => convertAttributeModelToDto(attr));
      const correlationIdsMap = action.payload.attributes.reduce((correlationMap, attr) => {
        correlationMap[attr.name] = attr.correlationId;
        return correlationMap;
      }, {});

      const {linkTypeId, onSuccess, onFailure} = action.payload;
      return this.linkTypeService.createAttributes(linkTypeId, attributesDto).pipe(
        map(attributes => attributes.map(attr => convertAttributeDtoToModel(attr, correlationIdsMap[attr.name]))),
        mergeMap(attributes => [
          new LinkTypesAction.CreateAttributesSuccess({linkTypeId, attributes}),
          ...createCallbackActions(onSuccess, attributes),
        ]),
        catchError(error => emitErrorActions(error, onFailure))
      );
    })
  );

  @Effect()
  public updateAttribute$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.UpdateAttribute>(LinkTypesActionType.UPDATE_ATTRIBUTE),
    mergeMap(action => {
      const {attributeId, linkTypeId, onSuccess, onFailure} = action.payload;
      const attributeDto = convertAttributeModelToDto(action.payload.attribute);

      return this.linkTypeService.updateAttribute(linkTypeId, attributeId, attributeDto).pipe(
        map(dto => convertAttributeDtoToModel(dto)),
        mergeMap(attribute => [
          new LinkTypesAction.UpdateAttributeSuccess({linkTypeId, attribute}),
          ...createCallbackActions(onSuccess, attribute),
        ]),
        catchError(error => emitErrorActions(error, onFailure))
      );
    })
  );

  @Effect()
  public deleteAttribute$: Observable<Action> = this.actions$.pipe(
    ofType<LinkTypesAction.DeleteAttribute>(LinkTypesActionType.DELETE_ATTRIBUTE),
    mergeMap(action => {
      const {linkTypeId, attributeId, onSuccess, onFailure} = action.payload;
      return this.store$.pipe(
        select(selectLinkTypeAttributeById(linkTypeId, attributeId)),
        take(1),
        mergeMap(attribute => {
          return this.linkTypeService.deleteAttribute(linkTypeId, attributeId).pipe(
            flatMap(() => [
              new LinkTypesAction.DeleteAttributeSuccess({linkTypeId, attribute}),
              ...createCallbackActions(onSuccess),
            ]),
            catchError(error => emitErrorActions(error, onFailure))
          );
        })
      );
    })
  );

  constructor(
    private actions$: Actions,
    private i18n: I18n,
    private linkTypeService: LinkTypeService,
    private store$: Store<AppState>
  ) {}
}
