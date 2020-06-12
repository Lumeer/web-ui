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

import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {CollectionService} from './collection.service';
import {AppState} from '../../store/app.state';
import {AttributeDto, CollectionDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {MockPermissionService} from '../common/mock-permission.service';
import {generateId} from '../../../shared/utils/resource.utils';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../../environments/environment';

@Injectable()
export class MockCollectionService extends MockPermissionService implements CollectionService {
  constructor(protected httpClient: HttpClient, protected store$: Store<AppState>) {
    super(store$);
  }

  public createCollection(collection: CollectionDto): Observable<CollectionDto> {
    return of({...collection, id: generateId(), documentsCount: 0});
  }

  public updateCollection(collection: CollectionDto): Observable<CollectionDto> {
    return of(collection);
  }

  public removeCollection(collectionId: string): Observable<string> {
    return of(collectionId);
  }

  public addFavorite(collectionId: string, workspace?: Workspace): Observable<any> {
    return of(true);
  }

  public removeFavorite(collectionId: string, workspace?: Workspace): Observable<any> {
    return of(true);
  }

  public getCollection(collectionId: string): Observable<CollectionDto> {
    return of(null);
  }

  public getCollections(workspace?: Workspace): Observable<CollectionDto[]> {
    const queryParams = new HttpParams().append('fromViews', 'true');
    return this.httpClient.get<CollectionDto[]>(this.apiPrefix(workspace), {params: queryParams});
  }

  public setDefaultAttribute(collectionId: string, attributeId: string): Observable<any> {
    return of(true);
  }

  public createAttribute(collectionId: string, attribute: AttributeDto): Observable<AttributeDto> {
    return of({...attribute, id: generateId()});
  }

  public createAttributes(collectionId: string, attributes: AttributeDto[]): Observable<AttributeDto[]> {
    return of(attributes.map(attribute => ({...attribute, id: generateId()})));
  }

  public updateAttribute(collectionId: string, id: string, attribute: AttributeDto): Observable<AttributeDto> {
    return of(attribute);
  }

  public removeAttribute(collectionId: string, id: string): Observable<any> {
    return of(true);
  }

  private apiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${environment.apiUrl}/rest/organizations/${organizationId}/projects/${projectId}/collections`;
  }
}
