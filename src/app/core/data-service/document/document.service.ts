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

import {Observable} from 'rxjs';
import {DocumentDto, LinkInstanceDto} from '../../dto';
import {DocumentMetaDataDto} from '../../dto/document.dto';
import {Workspace} from '../../store/navigation/workspace';

export abstract class DocumentService {
  public abstract createDocument(document: DocumentDto): Observable<DocumentDto>;

  public abstract patchDocument(
    collectionId: string,
    documentId: string,
    document: Partial<DocumentDto>
  ): Observable<DocumentDto>;

  public abstract updateDocumentData(document: DocumentDto): Observable<DocumentDto>;

  public abstract patchDocumentData(document: DocumentDto): Observable<DocumentDto>;

  public abstract updateDocumentMetaData(document: DocumentDto): Observable<DocumentDto>;

  public abstract patchDocumentMetaData(
    collectionId: string,
    documentId: string,
    metaData: DocumentMetaDataDto
  ): Observable<DocumentDto>;

  public abstract removeDocument(collectionId: string, documentId: string): Observable<any>;

  public abstract addFavorite(collectionId: string, documentId: string, workspace?: Workspace): Observable<any>;

  public abstract removeFavorite(collectionId: string, documentId: string, workspace?: Workspace): Observable<any>;

  public abstract getDocument(collectionId: string, documentId: string): Observable<DocumentDto>;

  public abstract getDocuments(documentsId: string[]): Observable<DocumentDto[]>;

  public abstract runRule(
    collectionId: string,
    documentId: string,
    attributeId: string,
    actionName?: string
  ): Observable<any>;

  public abstract duplicateDocuments(
    collectionId: string,
    documentIds: string[],
    correlationId?: string
  ): Observable<DocumentDto[]>;

  public abstract createChain(
    documents: DocumentDto[],
    linkInstances: LinkInstanceDto[]
  ): Observable<{documents: DocumentDto[]; linkInstances: LinkInstanceDto[]}>;
}
