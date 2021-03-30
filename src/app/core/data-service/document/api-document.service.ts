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

import {HttpClient, HttpResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DocumentService} from './document.service';
import {BaseService} from '../../rest/base.service';
import {AppState} from '../../store/app.state';
import {DocumentDto, LinkInstanceDto} from '../../dto';
import {DocumentMetaDataDto} from '../../dto/document.dto';
import {Workspace} from '../../store/navigation/workspace';
import {AppIdService} from '../../service/app-id.service';
import {correlationIdHeader} from '../../rest/interceptors/correlation-id.http-interceptor';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiDocumentService extends BaseService implements DocumentService {
  constructor(
    private httpClient: HttpClient,
    protected store$: Store<AppState>,
    private appId: AppIdService,
    private configurationService: ConfigurationService
  ) {
    super(store$);
  }

  public createDocument(document: DocumentDto): Observable<DocumentDto> {
    return this.httpClient.post<DocumentDto>(this.apiPrefix({collectionId: document.collectionId}), document);
  }

  public patchDocument(
    collectionId: string,
    documentId: string,
    document: Partial<DocumentDto>
  ): Observable<DocumentDto> {
    return this.httpClient.patch<DocumentDto>(`${this.apiPrefix({collectionId})}/${documentId}`, document);
  }

  public updateDocumentData(document: DocumentDto): Observable<DocumentDto> {
    return this.httpClient
      .put<DocumentDto>(`${this.apiPrefix({collectionId: document.collectionId})}/${document.id}/data`, document.data, {
        headers: {
          [correlationIdHeader]: this.appId.getAppId(),
        },
      })
      .pipe(
        map(returnedDocument => {
          return {...returnedDocument, collectionId: document.collectionId};
        })
      );
  }

  public patchDocumentData(document: DocumentDto): Observable<DocumentDto> {
    return this.httpClient.patch<DocumentDto>(
      `${this.apiPrefix({collectionId: document.collectionId})}/${document.id}/data`,
      document.data,
      {
        headers: {
          [correlationIdHeader]: this.appId.getAppId(),
        },
      }
    );
  }

  public updateDocumentMetaData(document: DocumentDto): Observable<DocumentDto> {
    return this.httpClient.put<DocumentDto>(
      `${this.apiPrefix({collectionId: document.collectionId})}/${document.id}/meta`,
      document.metaData
    );
  }

  public patchDocumentMetaData(
    collectionId: string,
    documentId: string,
    metaData: DocumentMetaDataDto
  ): Observable<DocumentDto> {
    return this.httpClient.patch<DocumentDto>(`${this.apiPrefix({collectionId})}/${documentId}/meta`, metaData);
  }

  public removeDocument(collectionId: string, documentId: string): Observable<HttpResponse<any>> {
    return this.httpClient.delete(`${this.apiPrefix({collectionId})}/${documentId}`, {
      observe: 'response',
      responseType: 'text',
    });
  }

  public addFavorite(collectionId: string, documentId: string, workspace?: Workspace): Observable<any> {
    return this.httpClient.post(`${this.apiPrefix({...workspace, collectionId})}/${documentId}/favorite`, {});
  }

  public removeFavorite(collectionId: string, documentId: string, workspace?: Workspace): Observable<any> {
    return this.httpClient.delete(`${this.apiPrefix({...workspace, collectionId})}/${documentId}/favorite`);
  }

  public getDocument(collectionId: string, documentId: string): Observable<DocumentDto> {
    return this.httpClient.get<DocumentDto>(`${this.apiPrefix({collectionId})}/${documentId}`);
  }

  public getDocuments(documentsId: string[]): Observable<DocumentDto[]> {
    return this.httpClient.post<DocumentDto[]>(`${this.workspaceApiPrefix()}/data/documents`, documentsId);
  }

  public duplicateDocuments(
    collectionId: string,
    documentIds: string[],
    correlationId?: string
  ): Observable<DocumentDto[]> {
    const options = correlationId ? {headers: {[correlationIdHeader]: correlationId}} : {};
    return this.httpClient.post<DocumentDto[]>(`${this.apiPrefix({collectionId})}/duplicate`, documentIds, options);
  }

  public createChain(
    documents: DocumentDto[],
    linkInstances: LinkInstanceDto[]
  ): Observable<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}> {
    return this.httpClient.post<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}>(
      `${this.workspaceApiPrefix()}/data/documentsChain`,
      {
        documents,
        linkInstances,
      }
    );
  }

  public runRule(collectionId: string, documentId: string, attributeId: string, actionName?: string): Observable<any> {
    return this.httpClient.post<any>(
      `${this.apiPrefix({collectionId})}/${documentId}/rule/${attributeId}?actionName=${actionName || ''}`,
      {
        correlationId: this.appId.getAppId(),
        actionName,
      }
    );
  }

  private apiPrefix(workspace?: Workspace): string {
    const collectionId = this.getOrCurrentCollectionId(workspace);

    return `${this.workspaceApiPrefix(workspace)}/collections/${collectionId}/documents`;
  }

  private workspaceApiPrefix(workspace?: Workspace): string {
    const organizationId = this.getOrCurrentOrganizationId(workspace);
    const projectId = this.getOrCurrentProjectId(workspace);

    return `${
      this.configurationService.getConfiguration().apiUrl
    }/rest/organizations/${organizationId}/projects/${projectId}`;
  }
}
