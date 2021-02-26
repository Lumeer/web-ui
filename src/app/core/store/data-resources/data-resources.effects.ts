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
import {Observable, of} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {DocumentsAction} from '../documents/documents.action';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {checkLoadedDataQuery, isDataQueryLoaded, isTaskQueryLoaded} from '../navigation/query/query.helper';
import {convertQueryModelToDto} from '../navigation/query/query.converter';
import {convertDocumentDtoToModel} from '../documents/document.converter';
import {SearchService} from '../../data-service';
import {AppState} from '../app.state';
import {DataResourcesAction, DataResourcesActionType} from './data-resources.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {convertLinkInstanceDtoToModel} from '../link-instances/link-instance.converter';
import {selectDataResourcesQueries, selectTasksQueries} from './data-resources.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {selectTasksCollectionsByReadPermission} from '../common/permissions.selectors';
import {checkTasksCollectionsQuery} from '../navigation/query/query.util';
import {environment} from '../../../../environments/environment';

@Injectable()
export class DataResourcesEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<DataResourcesAction.Get>(DataResourcesActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectDataResourcesQueries))),
    filter(
      ([action, queries]) =>
        action.payload.force || !isDataQueryLoaded(action.payload.query, queries, environment.publicView)
    ),
    mergeMap(([action]) => {
      const query = action.payload.query;
      const queryDto = convertQueryModelToDto(query);
      const savedQuery = checkLoadedDataQuery(query, environment.publicView, action.payload.silent);

      return this.searchService.searchDocumentsAndLinks(queryDto, query.includeSubItems, action.payload.workspace).pipe(
        mergeMap(({documents: documentsDtos, linkInstances: linksDtos}) => {
          const documents = documentsDtos.map(dto => convertDocumentDtoToModel(dto));
          const linkInstances = linksDtos.map(dto => convertLinkInstanceDtoToModel(dto));
          return [
            new DocumentsAction.GetSuccess({documents, query: savedQuery}),
            new LinkInstancesAction.GetSuccess({linkInstances, query: savedQuery}),
            new DataResourcesAction.GetSuccess({query: savedQuery}),
          ];
        }),
        catchError(error => of(new DocumentsAction.GetFailure({error}), new LinkInstancesAction.GetFailure({error})))
      );
    })
  );

  @Effect()
  public getTasks$: Observable<Action> = this.actions$.pipe(
    ofType<DataResourcesAction.GetTasks>(DataResourcesActionType.GET_TASKS),
    withLatestFrom(
      this.store$.pipe(select(selectTasksQueries)),
      this.store$.pipe(select(selectTasksCollectionsByReadPermission))
    ),
    filter(
      ([action, queries, tasksCollections]) =>
        action.payload.force || !isTaskQueryLoaded(action.payload.query, tasksCollections, queries)
    ),
    mergeMap(([action, , tasksCollections]) => {
      const query = action.payload.query;
      const loadQuery = checkTasksCollectionsQuery(tasksCollections, query);
      const queryDto = convertQueryModelToDto(loadQuery);
      const savedQuery = action.payload.silent ? undefined : loadQuery;

      return this.searchService
        .searchTaskDocumentsAndLinks(queryDto, query.includeSubItems, action.payload.workspace)
        .pipe(
          mergeMap(({documents: documentsDtos, linkInstances: linksDtos}) => {
            const documents = documentsDtos.map(dto => convertDocumentDtoToModel(dto));
            const linkInstances = linksDtos.map(dto => convertLinkInstanceDtoToModel(dto));
            return [
              new DocumentsAction.GetSuccess({documents}),
              new LinkInstancesAction.GetSuccess({linkInstances}),
              new DataResourcesAction.GetTasksSuccess({query: savedQuery}),
            ];
          }),
          catchError(error => of(new DataResourcesAction.GetTasksFailure({error})))
        );
    })
  );

  @Effect()
  public getTasksFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DataResourcesAction.GetTasksFailure>(DataResourcesActionType.GET_TASKS_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'tasks.get.fail', value: 'Could not get tasks'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private searchService: SearchService,
    private store$: Store<AppState>,
    private i18n: I18n
  ) {}
}
