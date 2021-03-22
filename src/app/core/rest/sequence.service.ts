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
import {map} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {Workspace} from '../store/navigation/workspace';
import {SequenceDto} from '../dto/sequence.dto';
import {BaseService} from './base.service';
import {ConfigurationService} from '../../configuration/configuration.service';

@Injectable()
export class SequenceService extends BaseService {
  constructor(
    protected httpClient: HttpClient,
    protected store: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store);
  }

  public updateSequence(sequence: SequenceDto): Observable<SequenceDto> {
    return this.httpClient.put<SequenceDto>(`${this.apiPrefix()}/${sequence.id}`, sequence);
  }

  public removeSequence(sequenceId: string): Observable<string> {
    return this.httpClient
      .delete(`${this.apiPrefix()}/${sequenceId}`, {observe: 'response', responseType: 'text'})
      .pipe(map(() => sequenceId));
  }

  public getSequences(workspace?: Workspace): Observable<SequenceDto[]> {
    return this.httpClient.get<SequenceDto[]>(this.apiPrefix(workspace));
  }

  private apiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}/sequences`;
  }
}
