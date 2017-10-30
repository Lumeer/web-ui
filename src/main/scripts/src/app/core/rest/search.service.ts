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

import {WorkspaceService} from '../workspace.service';
import {Suggestions} from '../dto/suggestions';
import {Query} from '../dto/query';
import {Collection} from '../dto/collection';
import {LumeerError} from '../error/lumeer.error';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {Document} from '../dto/document';
import {View} from '../dto/view';
import {SuggestionType} from '../dto/suggestion-type';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class SearchService {

  constructor(private http: HttpClient, private workspaceService: WorkspaceService) {
  }

  public suggest(text: string, type: SuggestionType): Observable<Suggestions> {
    return this.http.get<Suggestions>(`${this.searchPath()}/suggestions`,
      {params: new HttpParams().set('text', text).set('type', type.toString())});
  }

  public searchCollections(query: Query): Observable<Collection[]> {
    return this.http.post<Collection[]>(`${this.searchPath()}/collections`, query)
      .catch(SearchService.handleError);
  }

  public searchDocuments(query: Query): Observable<Document[]> {
    return this.http.post<Document[]>(`${this.searchPath()}/documents`, query)
      .catch(SearchService.handleError);
  }

  public searchViews(query: Query): Observable<View[]> {
    return this.http.post<View[]>(`${this.searchPath()}/views`, query)
      .catch(SearchService.handleError);
  }

  private searchPath(): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/search`;
  }

  private static handleError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
