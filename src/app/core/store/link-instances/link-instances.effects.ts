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
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {EMPTY, of} from 'rxjs';
import {catchError, filter, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {hasFilesAttributeChanged} from '../../../shared/utils/data/has-files-attribute-changed';
import {LinkInstanceDuplicateDto} from '../../dto/link-instance.dto';
import {AppState} from '../app.state';
import {hasAttributeType} from '../collections/collection.util';
import {FileAttachmentsAction} from '../file-attachments/file-attachments.action';
import {selectLinkTypeById} from '../link-types/link-types.state';
import {convertQueryModelToDto} from '../navigation/query/query.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {createCallbackActions, emitErrorActions} from '../utils/store.utils';
import {convertLinkInstanceDtoToModel, convertLinkInstanceModelToDto} from './link-instance.converter';
import {LinkInstancesAction, LinkInstancesActionType} from './link-instances.action';
import {
  selectLinkInstanceById,
  selectLinkInstancesDictionary,
  selectLinkInstancesLoadingQueries,
  selectLinkInstancesQueries,
} from './link-instances.state';
import {LinkInstanceService, SearchService} from '../../data-service';
import {ConstraintType} from '@lumeer/data-filters';
import {checkLoadedDataQueryPayload, shouldLoadByDataQuery} from '../utils/data-query-payload';
import {DocumentLinksDto} from '../../dto/document-links.dto';
import {selectCollectionsPermissions, selectLinkTypesPermissions} from '../user-permissions/user-permissions.state';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class LinkInstancesEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.Get>(LinkInstancesActionType.GET),
      withLatestFrom(
        this.store$.pipe(select(selectCollectionsPermissions)),
        this.store$.pipe(select(selectLinkTypesPermissions))
      ),
      map(([action, collectionsPermissions, linkTypePermissions]) =>
        checkLoadedDataQueryPayload(
          action.payload,
          this.configurationService.getConfiguration().publicView,
          collectionsPermissions,
          linkTypePermissions
        )
      ),
      withLatestFrom(
        this.store$.pipe(select(selectLinkInstancesQueries)),
        this.store$.pipe(select(selectLinkInstancesLoadingQueries))
      ),
      filter(([payload, queries, loadingQueries]) =>
        shouldLoadByDataQuery(payload, queries, loadingQueries, this.configurationService.getConfiguration().publicView)
      ),
      map(([payload, ,]) => payload),
      tap(payload => this.store$.dispatch(new LinkInstancesAction.SetLoadingQuery({query: payload.query}))),
      mergeMap(payload => {
        const query = payload.query;
        const queryDto = convertQueryModelToDto(query);

        return this.searchService.searchLinkInstances(queryDto, query.includeSubItems).pipe(
          map(dtos => dtos.map(dto => convertLinkInstanceDtoToModel(dto))),
          map(linkInstances => new LinkInstancesAction.GetSuccess({linkInstances, query})),
          catchError(error => of(new LinkInstancesAction.GetFailure({error, query})))
        );
      })
    )
  );

  public getSingle$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.GetSingle>(LinkInstancesActionType.GET_SINGLE),
      mergeMap(action =>
        this.linkInstanceService.getLinkInstance(action.payload.linkTypeId, action.payload.linkInstanceId).pipe(
          map(dto => convertLinkInstanceDtoToModel(dto)),
          map(linkInstance => new LinkInstancesAction.GetSuccess({linkInstances: [linkInstance]})),
          catchError(() => EMPTY)
        )
      )
    )
  );

  public getByIds$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.GetByIds>(LinkInstancesActionType.GET_BY_IDS),
      mergeMap(action =>
        this.linkInstanceService.getLinkInstances(action.payload.linkInstancesIds).pipe(
          map(dtos => dtos.map(dto => convertLinkInstanceDtoToModel(dto))),
          map(linkInstances => new LinkInstancesAction.GetSuccess({linkInstances})),
          catchError(() => EMPTY)
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.GetFailure>(LinkInstancesActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@link.instances.get.fail:Could not get links`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.Create>(LinkInstancesActionType.CREATE),
      mergeMap(action => {
        const linkInstanceDto = convertLinkInstanceModelToDto(action.payload.linkInstance);

        return this.linkInstanceService.createLinkInstance(linkInstanceDto).pipe(
          map(dto => convertLinkInstanceDtoToModel(dto, linkInstanceDto.correlationId)),
          mergeMap(linkInstance => [
            ...createCallbackActions(action.payload.onSuccess, linkInstance.id),
            new LinkInstancesAction.CreateSuccess({linkInstance}),
            ...createCallbackActions(action.payload.afterSuccess, linkInstance.id),
          ]),
          catchError(error =>
            of(...createCallbackActions(action.payload.onFailure), new LinkInstancesAction.CreateFailure({error}))
          )
        );
      })
    )
  );

  public createSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.CreateSuccess>(LinkInstancesActionType.CREATE_SUCCESS),
      mergeMap(action => {
        const {linkTypeId, id: linkInstanceId} = action.payload.linkInstance;
        return this.store$.pipe(
          select(selectLinkTypeById(linkTypeId)),
          take(1),
          mergeMap(linkType =>
            hasAttributeType(linkType, ConstraintType.Files)
              ? [new FileAttachmentsAction.Get({linkTypeId, linkInstanceId})]
              : []
          )
        );
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.Update>(LinkInstancesActionType.UPDATE),
      mergeMap(action => {
        const {linkInstance, nextAction} = action.payload;
        const linkInstanceDto = convertLinkInstanceModelToDto(linkInstance);

        return this.store$.pipe(
          select(selectLinkInstanceById(linkInstanceDto.id)),
          take(1),
          tap(() => this.store$.dispatch(new LinkInstancesAction.UpdateInternal({linkInstance}))),
          map(originalLinkInstance => ({...originalLinkInstance, correlationId: linkInstance.correlationId})),
          mergeMap(originalLinkInstance =>
            this.linkInstanceService.updateLinkInstance(linkInstanceDto).pipe(
              mergeMap(() => [
                ...createCallbackActions(action.payload.onSuccess),
                new LinkInstancesAction.UpdateSuccess({linkInstance, originalLinkInstance}),
                ...(nextAction ? [nextAction] : []),
                ...createCallbackActions(action.payload.afterSuccess),
              ]),
              catchError(error =>
                of(
                  ...createCallbackActions(action.payload.onFailure),
                  new LinkInstancesAction.UpdateFailure({error, originalLinkInstance})
                )
              )
            )
          )
        );
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.CreateFailure>(LinkInstancesActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@link.instance.create.fail:Could not create the link`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public patchData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.PatchData>(LinkInstancesActionType.PATCH_DATA),
      mergeMap(action => {
        const {id: linkInstanceId, data} = action.payload.linkInstance;

        return this.store$.pipe(
          select(selectLinkInstanceById(linkInstanceId)),
          take(1),
          tap(() => this.store$.dispatch(new LinkInstancesAction.PatchDataInternal({linkInstanceId, data}))),
          mergeMap(originalLinkInstance =>
            this.linkInstanceService.patchLinkInstanceData(linkInstanceId, data).pipe(
              map(dto => convertLinkInstanceDtoToModel(dto)),
              map(linkInstance => new LinkInstancesAction.UpdateSuccess({linkInstance, originalLinkInstance})),
              catchError(error => of(new LinkInstancesAction.UpdateFailure({error, originalLinkInstance})))
            )
          )
        );
      })
    )
  );

  public updateData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.UpdateData>(LinkInstancesActionType.UPDATE_DATA),
      withLatestFrom(this.store$.pipe(select(selectLinkInstancesDictionary))),
      mergeMap(([action, linkInstancesMap]) => {
        const originalLinkInstance = linkInstancesMap[action.payload.linkInstance.id];
        return of(new LinkInstancesAction.UpdateDataInternal({...action.payload, originalLinkInstance}));
      })
    )
  );

  public updateDataInternal$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.UpdateDataInternal>(LinkInstancesActionType.UPDATE_DATA_INTERNAL),
      mergeMap(action => {
        const originalLinkInstance = action.payload.originalLinkInstance;
        const linkInstanceDto = convertLinkInstanceModelToDto(action.payload.linkInstance);
        return this.linkInstanceService.updateLinkInstanceData(linkInstanceDto).pipe(
          map(dto => convertLinkInstanceDtoToModel(dto)),
          map(linkInstance => new LinkInstancesAction.UpdateSuccess({linkInstance, originalLinkInstance})),
          catchError(error => of(new LinkInstancesAction.UpdateFailure({error, originalLinkInstance})))
        );
      })
    )
  );

  public updateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.UpdateSuccess>(LinkInstancesActionType.UPDATE_SUCCESS),
      mergeMap(action => {
        const {linkInstance, originalLinkInstance} = action.payload;
        const {linkTypeId, id: linkInstanceId} = linkInstance;
        return this.store$.pipe(
          select(selectLinkTypeById(linkTypeId)),
          take(1),
          mergeMap(linkType =>
            hasFilesAttributeChanged(linkType, linkInstance, originalLinkInstance)
              ? [new FileAttachmentsAction.Get({linkTypeId, linkInstanceId})]
              : []
          )
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.UpdateFailure>(LinkInstancesActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@link.instance.update.fail:Could not update the link`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public changeDocuments$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.ChangeDocuments>(LinkInstancesActionType.CHANGE_DOCUMENTS),
      mergeMap(action => {
        const {linkInstanceId, documentIds} = action.payload;

        return this.store$.pipe(
          select(selectLinkInstancesDictionary),
          take(1),
          map(dictionary => dictionary[linkInstanceId]),
          mergeMap(linkInstance => {
            if (linkInstance) {
              const linkInstanceUpdate = {...linkInstance, documentIds};
              return [new LinkInstancesAction.Update({...action.payload, linkInstance: linkInstanceUpdate})];
            }
            return EMPTY;
          })
        );
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.Delete>(LinkInstancesActionType.DELETE),
      mergeMap(action =>
        this.store$.pipe(
          select(selectLinkInstanceById(action.payload.linkInstanceId)),
          take(1),
          tap(() =>
            this.store$.dispatch(new LinkInstancesAction.DeleteSuccess({linkInstanceId: action.payload.linkInstanceId}))
          ),
          mergeMap(linkInstance =>
            this.linkInstanceService.deleteLinkInstance(action.payload.linkInstanceId).pipe(
              mergeMap(() => (action.payload.nextAction ? of(action.payload.nextAction) : EMPTY)),
              catchError(error => of(new LinkInstancesAction.DeleteFailure({error, linkInstance})))
            )
          )
        )
      )
    )
  );

  public deleteConfirm$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.DeleteConfirm>(LinkInstancesActionType.DELETE_CONFIRM),
      map((action: LinkInstancesAction.DeleteConfirm) => {
        const title = $localize`:@@link.instance.delete.dialog.title:Remove link`;
        const message = $localize`:@@link.instance.delete.dialog.message:Do you really want to unlink (remove the link between) these records`;

        return new NotificationsAction.Confirm({
          title,
          message,
          action: new LinkInstancesAction.Delete(action.payload),
          type: 'danger',
        });
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.DeleteFailure>(LinkInstancesActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@link.instance.delete.fail:Could not delete the link`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public duplicate$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.Duplicate>(LinkInstancesActionType.DUPLICATE),
      mergeMap(action => {
        const {
          originalDocumentId,
          newDocumentId,
          linkInstanceIds,
          documentIdsMap,
          onSuccess,
          onFailure,
        } = action.payload;

        const duplicateDto: LinkInstanceDuplicateDto = {
          originalDocumentId,
          newDocumentId,
          linkInstanceIds,
          documentIdsMap,
        };

        return this.linkInstanceService.duplicateLinkInstances(duplicateDto).pipe(
          map(dtos => dtos.map(dto => convertLinkInstanceDtoToModel(dto))),
          mergeMap(linkInstances => [
            new LinkInstancesAction.DuplicateSuccess({linkInstances}),
            ...createCallbackActions(onSuccess, linkInstances),
          ]),
          catchError(error => emitErrorActions(error, onFailure))
        );
      })
    )
  );

  public duplicateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.DuplicateSuccess>(LinkInstancesActionType.DUPLICATE_SUCCESS),
      mergeMap(action => {
        const {linkInstances} = action.payload;
        const {linkTypeId} = linkInstances[0];
        return this.store$.pipe(
          select(selectLinkTypeById(linkTypeId)),
          take(1),
          mergeMap(linkType =>
            hasAttributeType(linkType, ConstraintType.Files)
              ? linkInstances.map(link => new FileAttachmentsAction.Get({linkTypeId, linkInstanceId: link.id}))
              : []
          )
        );
      })
    )
  );

  public setDocumentLinks$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.SetDocumentLinks>(LinkInstancesActionType.SET_DOCUMENT_LINKS),
      mergeMap(action => {
        const {linkTypeId, documentId, removedLinkInstancesIds, linkInstances, onSuccess, onFailure} = action.payload;

        const documentLinksDto: DocumentLinksDto = {
          documentId,
          removedLinkInstancesIds,
          createdLinkInstances: linkInstances.map(linkInstance => convertLinkInstanceModelToDto(linkInstance)),
        };

        return this.linkInstanceService.setDocumentLinks(linkTypeId, documentLinksDto).pipe(
          map(dtos => dtos.map(dto => convertLinkInstanceDtoToModel(dto))),
          mergeMap(createdLinkInstances => [
            new LinkInstancesAction.SetDocumentLinksSuccess({
              linkInstances: createdLinkInstances,
              removedLinkInstancesIds,
            }),
            ...createCallbackActions(onSuccess),
          ]),
          catchError(error =>
            of(new LinkInstancesAction.SetDocumentLinksFailure({error}), ...createCallbackActions(onFailure))
          )
        );
      })
    )
  );

  public setDocumentLinksFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.SetDocumentLinksFailure>(LinkInstancesActionType.SET_DOCUMENT_LINKS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@link.instance.document.setLinks.failure:Could not link records`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public runRule$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.RunRule>(LinkInstancesActionType.RUN_RULE),
      mergeMap(action => {
        const {linkTypeId, linkInstanceId, attributeId, actionName} = action.payload;

        return this.linkInstanceService.runRule(linkTypeId, linkInstanceId, attributeId, actionName).pipe(
          mergeMap(() => EMPTY),
          catchError(error => of(new LinkInstancesAction.RunRuleFailure({...action.payload, error})))
        );
      })
    )
  );

  public runRuleFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<LinkInstancesAction.RunRuleFailure>(LinkInstancesActionType.RUN_RULE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@dataResource.runRule.fail:Could not run the selected automation`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private actions$: Actions,
    private searchService: SearchService,
    private linkInstanceService: LinkInstanceService,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {}
}
