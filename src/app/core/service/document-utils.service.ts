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

import {DocumentAdditionalDataRequest, DocumentModel} from '../store/documents/document.model';
import {mergeMap, Observable, of, zip} from 'rxjs';
import {AttachmentsService, DocumentService} from '../data-service';
import {FileApiService} from './file-api.service';
import {Workspace} from '../store/navigation/workspace';
import {catchError, map} from 'rxjs/operators';
import {convertDocumentDtoToModel} from '../store/documents/document.converter';
import {DocumentDto} from '../dto';
import {FileAttachment, FileAttachmentType} from '../store/file-attachments/file-attachment.model';
import {createFileApiPath} from '../data-service/attachments/attachments.service';
import {convertFileAttachmentModelToDto} from '../store/file-attachments/file-attachment.converter';
import {flattenMatrix} from '../../shared/utils/array.utils';

@Injectable({
  providedIn: 'root',
})
export class DocumentUtilsService {
  constructor(
    private service: DocumentService,
    private attachmentService: AttachmentsService,
    private fileApiService: FileApiService
  ) {}

  public createWithAdditionalData(
    dto: DocumentDto,
    workspace: Workspace,
    data: DocumentAdditionalDataRequest,
    correlationId: string
  ): Observable<{
    document: DocumentModel;
    createdAttachments: FileAttachment[];
    uncreatedAttachments: number;
  }> {
    return this.service.createDocument(dto, workspace).pipe(
      mergeMap(dto =>
        this.createDocumentAttachments(dto, data, workspace).pipe(
          map(createdAttachments => {
            const document = convertDocumentDtoToModel(dto, correlationId);
            const createAttachments = shouldCreateFilesNumber(data);
            const uncreatedAttachments = createAttachments - createdAttachments.length;
            return {document, createdAttachments, uncreatedAttachments};
          })
        )
      )
    );
  }

  private createDocumentAttachments(
    dto: DocumentDto,
    data: DocumentAdditionalDataRequest,
    workspace: Workspace
  ): Observable<FileAttachment[]> {
    const createRequests: Observable<FileAttachment[]>[] = Object.keys(data.createFilesMap || {}).reduce(
      (requests, attributeId) => {
        const files = data.createFilesMap[attributeId] || [];
        if (files.length) {
          const fileAttachments: FileAttachment[] = files.map(file => ({
            collectionId: dto.collectionId,
            documentId: dto.id,
            attributeId,
            attachmentType: FileAttachmentType.Document,
            fileName: file.name,
          }));
          const path = createFileApiPath(workspace, fileAttachments[0]);
          const dtos = fileAttachments.map(fileAttachment =>
            convertFileAttachmentModelToDto(fileAttachment, workspace)
          );

          const request = this.attachmentService.createFiles(path, dtos).pipe(
            catchError(() => of([])),
            mergeMap(newAttachments => {
              const attachmentRequests: Observable<FileAttachment>[] = newAttachments.map((fileAttachment, index) =>
                this.fileApiService.uploadFile(fileAttachment.presignedUrl, files[index].type, files[index]).pipe(
                  map(() => fileAttachment),
                  catchError(() => of(null))
                )
              );
              if (attachmentRequests.length > 0) {
                return zip(attachmentRequests).pipe(map(result => result.filter(r => !!r)));
              }
              return of([]);
            })
          );

          requests.push(request);
        }

        return requests;
      },
      []
    );

    if (createRequests.length > 0) {
      return zip(createRequests).pipe(map(results => flattenMatrix(results)));
    }

    return of([]);
  }
}

function shouldCreateFilesNumber(data: DocumentAdditionalDataRequest): number {
  return Object.keys(data.createFilesMap || {}).reduce((num, attributeId) => {
    return num + (data.createFilesMap[attributeId] || []).length;
  }, 0);
}

function shouldDeleteFilesNumber(data: DocumentAdditionalDataRequest): number {
  return Object.keys(data.deleteFilesMap || {}).reduce((num, attributeId) => {
    return num + (data.deleteFilesMap[attributeId] || []).length;
  }, 0);
}
