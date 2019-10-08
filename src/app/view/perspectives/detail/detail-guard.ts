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
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {filter, mergeMap, take, tap} from 'rxjs/operators';
import {WorkspaceService} from '../../../workspace/workspace.service';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AppState} from '../../../core/store/app.state';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {QueryParam} from '../../../core/store/navigation/query-param';
import {convertStringToViewCursor, ViewCursor} from '../../../core/store/navigation/view-cursor/view-cursor';
import {convertQueryStringToModel} from '../../../core/store/navigation/query/query.converter';
import {Query} from '../../../core/store/navigation/query/query';
import {
  selectCollectionsByCustomQuery,
  selectDocumentsByCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {selectQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {filterStemsForCollection} from '../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../core/store/documents/documents.action';

@Injectable()
export class DetailGuard implements Resolve<DocumentModel[]> {
  public constructor(private store$: Store<AppState>, private workspaceService: WorkspaceService) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DocumentModel[]> {
    const parentRoute = route.parent && route.parent.parent;

    const organizationCode = parentRoute && parentRoute.paramMap.get('organizationCode');
    const projectCode = parentRoute && parentRoute.paramMap.get('projectCode');

    if (!organizationCode || !projectCode) {
      return of([]);
    }

    const cursorString = route.queryParamMap.get(QueryParam.ViewCursor);
    const cursor = cursorString && convertStringToViewCursor(cursorString);

    const queryString = route.queryParamMap.get(QueryParam.Query);
    const query = (queryString && convertQueryStringToModel(queryString)) || {};

    return this.workspaceService
      .selectOrGetWorkspace(organizationCode, projectCode)
      .pipe(mergeMap(({organization, project}) => this.resolveDocuments(organization, project, cursor, query)));
  }

  private resolveDocuments(
    organization: Organization,
    project: Project,
    cursor: ViewCursor,
    query: Query
  ): Observable<DocumentModel[]> {
    return this.store$.pipe(
      select(selectCollectionsByCustomQuery(query)),
      mergeMap(collections => {
        const selectedCollection =
          (cursor && (collections || []).find(coll => coll.id === cursor.collectionId)) ||
          (collections && collections[0]);
        if (selectedCollection) {
          const collectionQuery = filterStemsForCollection(selectedCollection.id, query);
          return this.store$.pipe(
            select(selectQueryDocumentsLoaded(collectionQuery)),
            tap(loaded => {
              if (!loaded) {
                const workspace = {organizationId: organization.id, projectId: project.id};
                this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery, workspace}));
              }
            }),
            filter(loaded => loaded),
            mergeMap(() => this.store$.pipe(select(selectDocumentsByCustomQuery(collectionQuery))))
          );
        }
        return of([]);
      }),
      take(1)
    );
  }
}
