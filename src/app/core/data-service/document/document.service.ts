/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Observable} from 'rxjs';
import {DocumentDto, LinkInstanceDto} from '../../dto';
import {DocumentMetaDataDto} from '../../dto/document.dto';
import {Workspace} from '../../store/navigation/workspace';

export abstract class DocumentService {
  abstract createDocument(document: DocumentDto): Observable<DocumentDto>;

  abstract patchDocument(collectionId: string, documentId: string, document: Partial<DocumentDto>): Observable<DocumentDto>;

  abstract updateDocumentData(document: DocumentDto): Observable<DocumentDto>;

  abstract patchDocumentData(document: DocumentDto): Observable<DocumentDto>;

  abstract updateDocumentMetaData(document: DocumentDto): Observable<DocumentDto>;

  abstract patchDocumentMetaData(collectionId: string, documentId: string, metaData: DocumentMetaDataDto): Observable<DocumentDto>;

  abstract removeDocument(collectionId: string, documentId: string): Observable<any>;

  abstract addFavorite(collectionId: string, documentId: string, workspace?: Workspace): Observable<any>;

  abstract removeFavorite(collectionId: string, documentId: string, workspace?: Workspace): Observable<any>;

  abstract getDocument(collectionId: string, documentId: string): Observable<DocumentDto>;

  abstract getDocuments(documentsId: string[]): Observable<DocumentDto[]>;

  abstract duplicateDocuments(collectionId: string, documentIds: string[], correlationId?: string): Observable<DocumentDto[]>;

  abstract createChain(documents: DocumentDto[], linkInstances: LinkInstanceDto[]): Observable<{ documents: DocumentDto[]; linkInstances: LinkInstanceDto[] }>;
}
