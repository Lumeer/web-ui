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
import {catchError, filter, mergeMap, withLatestFrom} from 'rxjs/operators';
import {selectDocumentsQueries} from '../documents/documents.state';
import {isQueryLoaded} from '../navigation/query/query.helper';
import {convertQueryModelToDto} from '../navigation/query/query.converter';
import {convertDocumentDtoToModel} from '../documents/document.converter';
import {SearchService} from '../../data-service';
import {AppState} from '../app.state';
import {DataResourcesAction, DataResourcesActionType} from './data-resources.action';
import {LinkInstancesAction} from '../link-instances/link-instances.action';
import {convertLinkInstanceDtoToModel} from '../link-instances/link-instance.converter';
import {selectDataResourcesQueries} from './data-resources.state';

@Injectable()
export class DataResourcesEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<DataResourcesAction.Get>(DataResourcesActionType.GET),
    withLatestFrom(this.store$.pipe(select(selectDataResourcesQueries))),
    filter(([action, queries]) => action.payload.force || !isQueryLoaded(action.payload.query, queries)),
    mergeMap(([action]) => {
      const query = action.payload.query;
      const queryDto = convertQueryModelToDto(query);
      const savedQuery = action.payload.silent ? undefined : query;

      return this.searchService.searchDocumentsAndLinks(queryDto, action.payload.workspace).pipe(
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

  constructor(private actions$: Actions, private searchService: SearchService, private store$: Store<AppState>) {}
}
