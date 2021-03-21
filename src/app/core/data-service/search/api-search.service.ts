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
import {AppState} from '../../store/app.state';
import {BaseService} from '../../rest/base.service';
import {SuggestionQueryDto} from '../../dto/suggestion-query.dto';
import {DocumentDto, LinkInstanceDto, QueryDto, SuggestionsDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {SearchService} from './search.service';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiSearchService extends BaseService implements SearchService {
  constructor(
    private http: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public suggest(dto: SuggestionQueryDto): Observable<SuggestionsDto> {
    return this.http.post<SuggestionsDto>(`${this.searchPath()}/suggestions`, dto);
  }

  public searchLinkInstances(
    query: QueryDto,
    includeSubItems: boolean,
    workspace?: Workspace
  ): Observable<LinkInstanceDto[]> {
    return this.http.post<LinkInstanceDto[]>(`${this.searchPath(workspace)}/linkInstances`, query, {
      params: {subItems: includeSubItems?.toString()},
    });
  }

  public searchDocuments(query: QueryDto, includeSubItems: boolean, workspace?: Workspace): Observable<DocumentDto[]> {
    return this.http.post<DocumentDto[]>(`${this.searchPath(workspace)}/documents`, query, {
      params: {subItems: includeSubItems?.toString()},
    });
  }

  public searchDocumentsAndLinks(
    query: QueryDto,
    includeSubItems: boolean,
    workspace?: Workspace
  ): Observable<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}> {
    return this.http.post<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}>(
      `${this.searchPath(workspace)}/documentsAndLinks`,
      query,
      {params: {subItems: includeSubItems?.toString()}}
    );
  }

  public searchTaskDocumentsAndLinks(
    query: QueryDto,
    includeSubItems: boolean,
    workspace?: Workspace
  ): Observable<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}> {
    return this.http.post<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}>(
      `${this.searchPath(workspace)}/tasks`,
      query,
      {params: {subItems: includeSubItems?.toString()}}
    );
  }

  private searchPath(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);
    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/search`;
  }
}
