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

import {InformationStoreService} from './information-store.service';
import {Injectable} from '@angular/core';
import {BaseService} from '../../rest/base.service';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {AppState} from '../../store/app.state';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {Workspace} from '../../store/navigation/workspace';
import {Observable} from 'rxjs';
import {InformationRecordDto} from '../../dto/information-record.dto';

@Injectable()
export class ApiInformationStoreService extends BaseService implements InformationStoreService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public getInformation(organizationId: string, id: string): Observable<InformationRecordDto> {
    return this.httpClient.get<InformationRecordDto>(this.apiPrefix({organizationId}, id));
  }

  private apiPrefix(workspace: Workspace, informationRecordId: string): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/info-store/${informationRecordId}`;
  }
}
