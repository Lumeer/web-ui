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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {Collection} from '../dto/collection';
import {DocumentDto} from '../dto/document.dto';
import {Query} from '../dto/query';
import {SuggestionType} from '../dto/suggestion-type';
import {Suggestions} from '../dto/suggestions';
import {View} from '../dto/view';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';

@Injectable()
export class SearchService {
  private workspace: Workspace;

  constructor(private http: HttpClient, private store: Store<AppState>) {
    this.store
      .select(selectWorkspace)
      .pipe(filter(workspace => !!workspace && !!workspace.organizationCode && !!workspace.projectCode))
      .subscribe(workspace => (this.workspace = workspace));
  }

  public suggest(text: string, type: SuggestionType): Observable<Suggestions> {
    return this.http.get<Suggestions>(`${this.searchPath()}/suggestions`, {
      params: new HttpParams().set('text', text).set('type', type.toString()),
    });
  }

  public searchCollections(query: Query, workspace?: Workspace): Observable<Collection[]> {
    return this.http.post<Collection[]>(`${this.searchPath(workspace)}/collections`, query);
  }

  public searchDocuments(query: Query): Observable<DocumentDto[]> {
    return this.http.post<DocumentDto[]>(`${this.searchPath()}/documents`, query);
  }

  public searchViews(query: Query): Observable<View[]> {
    return this.http.post<View[]>(`${this.searchPath()}/views`, query);
  }

  private searchPath(workspace?: Workspace): string {
    const w = workspace || this.workspace;
    return `${environment.apiUrl}/rest/organizations/${w.organizationCode}/projects/${w.projectCode}/search`;
  }
}
