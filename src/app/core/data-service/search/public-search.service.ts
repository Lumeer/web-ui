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
import {Observable, of} from 'rxjs';
import {Workspace} from '../../store/navigation/workspace';
import {DocumentDto, LinkInstanceDto, QueryDto, SuggestionsDto} from '../../dto';
import {SuggestionQueryDto} from '../../dto/suggestion-query.dto';
import {AppState} from '../../store/app.state';
import {BaseService} from '../../rest/base.service';
import {SearchService} from './search.service';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class PublicSearchService extends BaseService implements SearchService {
  constructor(
    private http: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public suggest(dto: SuggestionQueryDto): Observable<SuggestionsDto> {
    return of({attributes: [], collections: [], linkAttributes: [], linkTypes: [], views: []});
  }

  public searchLinkInstances(
    query: QueryDto,
    includeSubItems?: boolean,
    workspace?: Workspace
  ): Observable<LinkInstanceDto[]> {
    return this.http.get<LinkInstanceDto[]>(`${this.searchPath(workspace)}/link-instances`);
  }

  public searchDocuments(query: QueryDto, includeSubItems?: boolean, workspace?: Workspace): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(`${this.searchPath(workspace)}/documents`);
  }

  public searchDocumentsAndLinks(
    query: QueryDto,
    includeSubItems?: boolean,
    workspace?: Workspace
  ): Observable<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}> {
    return this.http.get<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}>(
      `${this.searchPath(workspace)}/documentsAndLinks`
    );
  }

  public searchTaskDocumentsAndLinks(
    query: QueryDto,
    includeSubItems?: boolean,
    workspace?: Workspace
  ): Observable<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}> {
    return this.http.get<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}>(
      `${this.searchPath(workspace)}/tasks`
    );
  }

  private searchPath(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);
    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/p/organizations/${organizationId}/projects/${projectId}`;
  }
}
