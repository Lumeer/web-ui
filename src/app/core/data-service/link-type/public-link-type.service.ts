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
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {LinkTypeService} from './link-type.service';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {AttributeDto, LinkTypeDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {generateId} from '../../../shared/utils/resource.utils';
import {selectLinkTypeById} from '../../store/link-types/link-types.state';
import {map} from 'rxjs/operators';
import {convertLinkTypeModelToDto} from '../../store/link-types/link-type.converter';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class PublicLinkTypeService extends BaseService implements LinkTypeService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createLinkType(linkType: LinkTypeDto): Observable<LinkTypeDto> {
    return of({...linkType, id: generateId(), version: 0, linksCount: 0});
  }

  public getLinkType(id: string): Observable<LinkTypeDto> {
    return of(null);
  }

  public updateLinkType(id: string, dto: LinkTypeDto): Observable<LinkTypeDto> {
    return this.store$.pipe(
      select(selectLinkTypeById(id)),
      map(linkType => ({...convertLinkTypeModelToDto(linkType), ...dto}))
    );
  }

  public deleteLinkType(id: string): Observable<string> {
    return of(id);
  }

  public getLinkTypes(workspace?: Workspace): Observable<LinkTypeDto[]> {
    return this.httpClient.get<LinkTypeDto[]>(this.restApiPrefix(workspace));
  }

  public createAttributes(linkTypeId: string, attributes: AttributeDto[]): Observable<AttributeDto[]> {
    return of(attributes.map(attribute => ({...attribute, id: generateId()})));
  }

  public updateAttribute(linkTypeId: string, id: string, attribute: AttributeDto): Observable<AttributeDto> {
    return of(attribute);
  }

  public deleteAttribute(linkTypeId: string, id: string): Observable<any> {
    return of(true);
  }

  private restApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/p/organizations/${organizationId}/projects/${projectId}/link-types`;
  }
}
