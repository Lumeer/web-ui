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

import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {CollectionService} from './collection.service';
import {AppState} from '../../store/app.state';
import {AttributeDto, CollectionDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {PublicPermissionService} from '../common/public-permission.service';
import {generateId} from '../../../shared/utils/resource.utils';
import {HttpClient} from '@angular/common/http';
import {map, mergeMap, take} from 'rxjs/operators';
import {DEFAULT_USER} from '../../constants';
import {setDefaultUserPermissions} from '../common/public-api-util';
import {Role} from '../../model/role';
import {selectCollectionById} from '../../store/collections/collections.state';
import {convertCollectionModelToDto} from '../../store/collections/collection.converter';
import {selectPublicProject} from '../../store/projects/projects.state';
import {CollectionPurposeDto} from '../../dto/collection.dto';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class PublicCollectionService extends PublicPermissionService implements CollectionService {
  constructor(
    protected httpClient: HttpClient,
    protected store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createCollection(collection: CollectionDto): Observable<CollectionDto> {
    return this.isProjectWritable$().pipe(
      map(writable =>
        setCollectionPermissions({...collection, id: generateId(), documentsCount: 0, version: 0}, writable)
      )
    );
  }

  public updateCollection(dto: CollectionDto): Observable<CollectionDto> {
    return this.store$.pipe(
      select(selectCollectionById(dto.id)),
      map(collection => ({...convertCollectionModelToDto(collection), ...dto, version: (collection.version || 0) + 1})),
      take(1),
      mergeMap(collection =>
        this.isProjectWritable$().pipe(map(editable => setCollectionPermissions(collection, editable)))
      )
    );
  }

  public updatePurpose(collectionId: string, purpose: CollectionPurposeDto): Observable<CollectionDto> {
    return this.store$.pipe(
      select(selectCollectionById(collectionId)),
      map(collection => ({
        ...convertCollectionModelToDto(collection),
        purpose,
        version: (collection.version || 0) + 1,
      })),
      take(1),
      mergeMap(collection =>
        this.isProjectWritable$().pipe(map(editable => setCollectionPermissions(collection, editable)))
      )
    );
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
    return this.httpClient
      .get<CollectionDto[]>(this.apiPrefix(workspace))
      .pipe(
        mergeMap(collections =>
          this.isProjectWritable$().pipe(
            map(editable => collections.map(collection => setCollectionPermissions(collection, editable)))
          )
        )
      );
  }

  private isProjectWritable$(): Observable<boolean> {
    return this.store$.pipe(
      select(selectPublicProject),
      map(project => project?.templateMetadata?.editable),
      take(1)
    );
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

  public runRule(collectionId: string, ruleName: string): Observable<any> {
    return of(true);
  }

  private apiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/p/organizations/${organizationId}/projects/${projectId}/collections`;
  }
}

function setCollectionPermissions(dto: CollectionDto, editable?: boolean): CollectionDto {
  return setDefaultUserPermissions(dto, DEFAULT_USER, editable ? [Role.Read, Role.Write, Role.Manage] : [Role.Read]);
}
