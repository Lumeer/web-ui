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
import {HttpClient, HttpParams} from '@angular/common/http';
import {Store} from '@ngrx/store';

import {Observable} from 'rxjs';
import {CollectionDto} from '../dto';
import {AppState} from '../store/app.state';
import {ImportedCollectionDto} from '../dto/imported-collection.dto';
import {BaseService} from './base.service';
import {ConfigurationService} from '../../configuration/configuration.service';

@Injectable()
export class ImportService extends BaseService {
  constructor(
    private http: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public importFile(format: string, importedCollection: ImportedCollectionDto): Observable<CollectionDto> {
    const queryParams = new HttpParams().set('format', format);

    return this.http.post<CollectionDto>(this.apiPrefix(), importedCollection, {params: queryParams});
  }

  private apiPrefix(): string {
    const organizationId = this.getOrCurrentOrganizationId();
    const projectId = this.getOrCurrentProjectId();

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/import`;
  }
}
