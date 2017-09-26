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

import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpParams, HttpResponse} from '@angular/common/http';

import {Collection} from '../dto/collection';
import {Attribute} from '../dto/attribute';
import {Observable} from 'rxjs/Observable';
import {BadInputError} from '../error/bad-input.error';
import {PermissionService} from './permission.service';
import {isNullOrUndefined} from 'util';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {ConfiguredAttribute} from '../../collection/config/attribute-list/configured-attribute';
import 'rxjs/add/operator/catch';

@Injectable()
export class CollectionService extends PermissionService {

  public createCollection(collection: Collection): Observable<HttpResponse<any>> {
    return this.httpClient.post(this.apiPrefix(), this.toDto(collection), {observe: 'response'})
      .catch(this.handleError);
  }

  public updateCollection(collection: Collection): Observable<Collection> {
    return this.httpClient.put(`${this.apiPrefix()}/${collection.code}`, this.toDto(collection))
      .catch(this.handleError);
  }

  public removeCollection(collectionCode: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}`, {observe: 'response'})
      .catch(this.handleError);
  }

  public getCollection(collectionCode: string): Observable<Collection> {
    return this.httpClient.get<Collection>(`${this.apiPrefix()}/${collectionCode}`)
      .catch(CollectionService.handleGlobalError);
  }

  public getCollections(pageNumber?: number, pageSize?: number): Observable<Collection[]> {
    const queryParams = new HttpParams();

    if (!isNullOrUndefined(pageNumber) && !isNullOrUndefined(pageSize)) {
      queryParams.set('page', pageNumber.toString())
        .set('size', pageSize.toString());
    }

    return this.httpClient.get<Collection[]>(this.apiPrefix(), {params: queryParams})
      .catch(CollectionService.handleGlobalError);
  }

  /**
   * @deprecated Get attributes from collection instead.
   */
  public getAttributes(collectionCode: string): Observable<Attribute[]> {
    return this.httpClient.get<Attribute[]>(`${this.apiPrefix()}/${collectionCode}/attributes`)
      .catch(CollectionService.handleGlobalError);
  }

  public updateAttribute(collectionCode: string, fullName: string, attribute: Attribute): Observable<Attribute> {
    return this.httpClient.put<Attribute>(`${this.apiPrefix()}/${collectionCode}/attributes/${fullName}`, this.attributeToDto(attribute))
      .catch(CollectionService.handleGlobalError);
  }

  public removeAttribute(collectionCode: string, fullName: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix()}/${collectionCode}/attributes/${fullName}`, {observe: 'response'});
  }

  protected actualApiPrefix() {
    const collectionCode = this.workspaceService.collectionCode;

    return `${this.apiPrefix()}/${collectionCode}`;
  }

  private toDto(collection: Collection): Collection {
    return {
      code: collection.code,
      name: collection.name,
      color: collection.color,
      icon: collection.icon,
      permissions: collection.permissions,
      attributes: collection.attributes.map(this.attributeToDto)
    };
  }

  private attributeToDto(attribute: Attribute | ConfiguredAttribute): Attribute {
    return {
      constraints: attribute.constraints,
      fullName: attribute.fullName,
      name: attribute.name,
      usageCount: attribute.usageCount
    };
  }

  private apiPrefix(): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections`;
  }

  private handleError(error: HttpErrorResponse): ErrorObservable {
    if (error.status === 400) {
      throw new BadInputError('Name already exists');
    }
    return CollectionService.handleGlobalError(error);
  }

}
