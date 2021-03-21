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
import {of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {DocumentsAction} from '../documents/documents.action';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {convertQueryModelToDto} from '../navigation/query/query.converter';
import {convertDocumentDtoToModel} from '../documents/document.converter';
import {SearchService} from '../../data-service';
import {AppState} from '../app.state';
import {DataResourcesAction, DataResourcesActionType} from './data-resources.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {convertLinkInstanceDtoToModel} from '../link-instances/link-instance.converter';
import {
  selectDataResourcesLoadingQueries,
  selectDataResourcesQueries,
  selectTasksLoadingQueries,
  selectTasksQueries,
} from './data-resources.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {checkLoadedDataQueryPayload, shouldLoadByDataQuery} from '../utils/data-query-payload';
import {selectCollectionsPermissions, selectLinkTypesPermissions} from '../user-permissions/user-permissions.state';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class DataResourcesEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<DataResourcesAction.Get>(DataResourcesActionType.GET),
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
        this.store$.pipe(select(selectDataResourcesQueries)),
        this.store$.pipe(select(selectDataResourcesLoadingQueries))
      ),
      filter(([payload, queries, loadingQueries]) =>
        shouldLoadByDataQuery(payload, queries, loadingQueries, this.configurationService.getConfiguration().publicView)
      ),
      map(([payload, ,]) => payload),
      tap(payload => this.store$.dispatch(new DataResourcesAction.SetLoadingQuery({query: payload.query}))),
      mergeMap(payload => {
        const query = payload.query;
        const queryDto = convertQueryModelToDto(query);

        return this.searchService.searchDocumentsAndLinks(queryDto, query.includeSubItems, payload.workspace).pipe(
          mergeMap(({documents: documentsDtos, linkInstances: linksDtos}) => {
            const documents = documentsDtos.map(dto => convertDocumentDtoToModel(dto));
            const linkInstances = linksDtos.map(dto => convertLinkInstanceDtoToModel(dto));
            return [
              new DocumentsAction.GetSuccess({documents, query}),
              new LinkInstancesAction.GetSuccess({linkInstances, query}),
              new DataResourcesAction.GetSuccess({query}),
            ];
          }),
          catchError(error =>
            of(
              new DataResourcesAction.GetFailure({error, query}),
              new DocumentsAction.GetFailure({error}),
              new LinkInstancesAction.GetFailure({error})
            )
          )
        );
      })
    )
  );

  public getTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType<DataResourcesAction.GetTasks>(DataResourcesActionType.GET_TASKS),
      map(action =>
        checkLoadedDataQueryPayload(action.payload, this.configurationService.getConfiguration().publicView)
      ),
      withLatestFrom(this.store$.pipe(select(selectTasksQueries)), this.store$.pipe(select(selectTasksLoadingQueries))),
      filter(([payload, queries, loadingQueries]) =>
        shouldLoadByDataQuery(payload, queries, loadingQueries, this.configurationService.getConfiguration().publicView)
      ),
      map(([payload, ,]) => payload),
      tap(payload => this.store$.dispatch(new DataResourcesAction.SetLoadingTasksQuery({query: payload.query}))),
      mergeMap(payload => {
        const query = payload.query;
        const queryDto = convertQueryModelToDto(query);

        return this.searchService.searchTaskDocumentsAndLinks(queryDto, query.includeSubItems, payload.workspace).pipe(
          mergeMap(({documents: documentsDtos, linkInstances: linksDtos}) => {
            const documents = documentsDtos.map(dto => convertDocumentDtoToModel(dto));
            const linkInstances = linksDtos.map(dto => convertLinkInstanceDtoToModel(dto));
            return [
              new DocumentsAction.GetSuccess({documents}),
              new LinkInstancesAction.GetSuccess({linkInstances}),
              new DataResourcesAction.GetTasksSuccess({query}),
            ];
          }),
          catchError(error => of(new DataResourcesAction.GetTasksFailure({error, query})))
        );
      })
    )
  );

  public getTasksFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<DataResourcesAction.GetTasksFailure>(DataResourcesActionType.GET_TASKS_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@tasks.get.fail:Could not get tasks`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private actions$: Actions,
    private searchService: SearchService,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {}
}
