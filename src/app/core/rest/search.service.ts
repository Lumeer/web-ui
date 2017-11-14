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
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {Suggestions} from '../dto/suggestions';
import {Query} from '../dto/query';
import {Collection} from '../dto/collection';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {Document} from '../dto/document';
import {View} from '../dto/view';
import {SuggestionType} from '../dto/suggestion-type';
import {Observable} from 'rxjs/Observable';
import {catchError, map, switchMap} from 'rxjs/operators';
import {Workspace} from '../store/navigation/workspace.model';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {isNullOrUndefined} from 'util';
import {HomePageService} from './home-page.service';

@Injectable()
export class SearchService {

  private workspace: Workspace;

  constructor(private http: HttpClient,
              private store: Store<AppState>,
              private homePageService: HomePageService) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public suggest(text: string, type: SuggestionType): Observable<Suggestions> {
    return this.http.get<Suggestions>(`${this.searchPath()}/suggestions`,
      {params: new HttpParams().set('text', text).set('type', type.toString())});
  }

  public searchCollections(query: Query): Observable<Collection[]> {
    return this.http.post<Collection[]>(`${this.searchPath()}/collections`, query)
      .pipe(
        catchError(SearchService.handleError),
        switchMap(collections => this.homePageService.checkFavoriteCollections(collections))
      );
  }

  public searchDocuments(query: Query): Observable<Document[]> {
    return this.http.post<Document[]>(`${this.searchPath()}/documents`, query)
      .pipe(// TODO remove after backend supports pagination
      map(documents => {
        if (isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
          return documents;
        }

        return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
      }),catchError(SearchService.handleError),
        switchMap(documents => this.homePageService.checkFavoriteDocuments(documents)));
  }

  public searchViews(query: Query): Observable<View[]> {
    return this.http.post<View[]>(`${this.searchPath()}/views`, query)
      .pipe(catchError(SearchService.handleError));
  }

  private searchPath(): string {
    return `/${API_URL}/rest/organizations/${this.workspace.organizationCode}/projects/${this.workspace.projectCode}/search`;
  }

  private static handleError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
