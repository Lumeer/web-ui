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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {SuggestionsDto, DocumentDto, QueryDto} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace';
import {LinkInstance} from '../store/link-instances/link.instance';
import {SuggestionQueryDto} from '../dto/suggestion-query.dto';

@Injectable()
export class SearchService {
  private workspace: Workspace;

  constructor(private http: HttpClient, private store$: Store<AppState>) {
    this.store$
      .pipe(
        select(selectWorkspace),
        filter(workspace => !!workspace && !!workspace.organizationCode && !!workspace.projectCode)
      )
      .subscribe(workspace => (this.workspace = workspace));
  }

  public suggest(dto: SuggestionQueryDto): Observable<SuggestionsDto> {
    return this.http.post<SuggestionsDto>(`${this.searchPath()}/suggestions`, dto);
  }

  public searchLinkInstances(query: QueryDto): Observable<LinkInstance[]> {
    return this.http.post<LinkInstance[]>(`${this.searchPath()}/linkInstances`, query);
  }

  public searchDocuments(query: QueryDto): Observable<DocumentDto[]> {
    return this.http.post<DocumentDto[]>(`${this.searchPath()}/documents`, query);
  }

  private searchPath(workspace?: Workspace): string {
    const w = workspace || this.workspace;
    return `${environment.apiUrl}/rest/organizations/${w.organizationCode}/projects/${w.projectCode}/search`;
  }
}
