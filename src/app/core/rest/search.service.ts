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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SuggestionsDto, DocumentDto, QueryDto, LinkInstanceDto} from '../dto';
import {AppState} from '../store/app.state';
import {Workspace} from '../store/navigation/workspace';
import {SuggestionQueryDto} from '../dto/suggestion-query.dto';
import {BaseService} from './base.service';

@Injectable()
export class SearchService extends BaseService {
  constructor(private http: HttpClient, protected store$: Store<AppState>) {
    super(store$);
  }

  public suggest(dto: SuggestionQueryDto): Observable<SuggestionsDto> {
    return this.http.post<SuggestionsDto>(`${this.searchPath()}/suggestions`, dto);
  }

  public searchLinkInstances(query: QueryDto, workspace?: Workspace): Observable<LinkInstanceDto[]> {
    return this.http.post<LinkInstanceDto[]>(`${this.searchPath(workspace)}/linkInstances`, query);
  }

  public searchDocuments(query: QueryDto, workspace?: Workspace): Observable<DocumentDto[]> {
    return this.http.post<DocumentDto[]>(`${this.searchPath(workspace)}/documents`, query);
  }

  private searchPath(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);
    return `${environment.apiUrl}/rest/organizations/${organizationId}/projects/${projectId}/search`;
  }
}
