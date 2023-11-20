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
import {Store, select} from '@ngrx/store';

import {Observable, combineLatest, of} from 'rxjs';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';

import {ConfigurationService} from '../../../configuration/configuration.service';
import {SearchService} from '../../data-service';
import {AppState} from '../app.state';
import {convertDocumentDtoToModel} from '../documents/document.converter';
import {DocumentModel} from '../documents/document.model';
import {DocumentsAction} from '../documents/documents.action';
import {convertLinkInstanceDtoToModel} from '../link-instances/link-instance.converter';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {LinkInstance} from '../link-instances/link.instance';
import {convertQueryModelToDto} from '../navigation/query/query.converter';
import {WorkspaceQuery} from '../navigation/query/workspace-query';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectResourcesPermissions} from '../user-permissions/user-permissions.state';
import {checkLoadedDataQueryPayload, shouldLoadByDataQuery} from '../utils/data-query-payload';
import {DataResourcesAction, DataResourcesActionType} from './data-resources.action';
import {
  selectDataResourcesLoadingQueries,
  selectDataResourcesQueries,
  selectTasksLoadingQueries,
  selectTasksQueries,
} from './data-resources.state';

@Injectable()
export class DataResourcesEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<DataResourcesAction.Get>(DataResourcesActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectResourcesPermissions))),
      map(([action, permissions]) =>
        checkLoadedDataQueryPayload(
          action.payload,
          this.configurationService.getConfiguration().publicView,
          permissions
        )
      ),
      withLatestFrom(
        this.store$.pipe(select(selectDataResourcesQueries)),
        this.store$.pipe(select(selectDataResourcesLoadingQueries)),
        this.store$.pipe(select(selectResourcesPermissions))
      ),
      filter(([payload, queries, loadingQueries, permissions]) =>
        shouldLoadByDataQuery(
          payload,
          queries,
          loadingQueries,
          this.configurationService.getConfiguration().publicView,
          permissions
        )
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
      withLatestFrom(this.store$.pipe(select(selectResourcesPermissions))),
      map(([action, permissions]) =>
        checkLoadedDataQueryPayload(
          action.payload,
          this.configurationService.getConfiguration().publicView,
          permissions
        )
      ),
      withLatestFrom(
        this.store$.pipe(select(selectTasksQueries)),
        this.store$.pipe(select(selectTasksLoadingQueries)),
        this.store$.pipe(select(selectResourcesPermissions))
      ),
      filter(([payload, queries, loadingQueries, permissions]) =>
        shouldLoadByDataQuery(
          payload,
          queries,
          loadingQueries,
          this.configurationService.getConfiguration().publicView,
          permissions
        )
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

  public refreshData$ = createEffect(() =>
    this.actions$.pipe(
      ofType<DataResourcesAction.RefreshData>(DataResourcesActionType.REFRESH_DATA),
      mergeMap(action => {
        return combineLatest(this.refreshDataObservables(action)).pipe(
          mergeMap(results => {
            const documents = results.reduce((data, result) => [...data, ...result.documents], []);
            const linkInstances = results.reduce((data, result) => [...data, ...result.linkInstances], []);
            const documentsQueries = results.map(result => result.documentsQuery).filter(query => !!query);
            const linkInstancesQueries = results.map(result => result.linkInstancesQuery).filter(query => !!query);
            const dataResourcesQueries = results.map(result => result.dataResourcesQuery).filter(query => !!query);
            const tasksQueries = results.map(result => result.tasksQuery).filter(query => !!query);
            return [
              new DocumentsAction.RefreshSuccess({documents, queries: documentsQueries}),
              new LinkInstancesAction.RefreshSuccess({linkInstances, queries: linkInstancesQueries}),
              new DataResourcesAction.RefreshDataSuccess({dataResourcesQueries, tasksQueries}),
            ];
          })
        );
      })
    )
  );

  private refreshDataObservables(action: DataResourcesAction.RefreshData): Observable<{
    documents: DocumentModel[];
    linkInstances: LinkInstance[];
    documentsQuery?: WorkspaceQuery;
    tasksQuery?: WorkspaceQuery;
    linkInstancesQuery?: WorkspaceQuery;
    dataResourcesQuery?: WorkspaceQuery;
  }>[] {
    const {documentsQueries, tasksQueries, dataResourcesQueries, linkInstancesQueries} = action.payload;
    const emptyResult = of({documents: [], linkInstances: []});

    const documentsObservables = documentsQueries.map(query =>
      this.searchService.searchDocuments(convertQueryModelToDto(query), query.includeSubItems, query.workspace).pipe(
        map(documents => ({
          documents: documents.map(dto => convertDocumentDtoToModel(dto)),
          linkInstances: [],
          documentsQuery: query,
        })),
        catchError(() => emptyResult)
      )
    );
    const tasksObservables = tasksQueries.map(query =>
      this.searchService
        .searchTaskDocumentsAndLinks(convertQueryModelToDto(query), query.includeSubItems, query.workspace)
        .pipe(
          map(({documents, linkInstances}) => ({
            documents: documents.map(dto => convertDocumentDtoToModel(dto)),
            linkInstances: linkInstances.map(dto => convertLinkInstanceDtoToModel(dto)),
            tasksQuery: query,
          })),
          catchError(() => emptyResult)
        )
    );
    const linksObservables = linkInstancesQueries.map(query =>
      this.searchService
        .searchLinkInstances(convertQueryModelToDto(query), query.includeSubItems, query.workspace)
        .pipe(
          map(linkInstances => ({
            documents: [],
            linkInstances: linkInstances.map(dto => convertLinkInstanceDtoToModel(dto)),
            linkInstancesQuery: query,
          })),
          catchError(() => emptyResult)
        )
    );
    const dataResourcesObservables = dataResourcesQueries.map(query =>
      this.searchService
        .searchDocumentsAndLinks(convertQueryModelToDto(query), query.includeSubItems, query.workspace)
        .pipe(
          map(({documents, linkInstances}) => ({
            documents: documents.map(dto => convertDocumentDtoToModel(dto)),
            linkInstances: linkInstances.map(dto => convertLinkInstanceDtoToModel(dto)),
            dataResourcesQuery: query,
          })),
          catchError(() => emptyResult)
        )
    );

    return [...documentsObservables, ...linksObservables, ...dataResourcesObservables, ...tasksObservables];
  }

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
