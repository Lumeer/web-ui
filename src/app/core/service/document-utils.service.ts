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
import {catchError, map, withLatestFrom} from 'rxjs/operators';
import {convertDocumentDtoToModel} from '../store/documents/document.converter';
import {DocumentDto} from '../dto';
import {FileAttachment, FileAttachmentType} from '../store/file-attachments/file-attachment.model';
import {createFileApiPath} from '../data-service/attachments/attachments.service';
import {convertFileAttachmentModelToDto} from '../store/file-attachments/file-attachment.converter';
import {DataResourceData} from '../model/resource';
import {uniqueValues} from '../../shared/utils/array.utils';
import {DataCursor} from '../../shared/data-input/data-cursor';
import {select, Store} from '@ngrx/store';
import {selectFileAttachmentsByDataCursor} from '../store/file-attachments/file-attachments.state';
import {AppState} from '../store/app.state';

@Injectable({
  providedIn: 'root',
})
export class DocumentUtilsService {
  constructor(
    private store$: Store<AppState>,
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
      mergeMap(createdDto =>
        this.createDocumentAttachments(createdDto, data, workspace).pipe(
          mergeMap(created => this.patchCreatedAttachments(createdDto, workspace, {created})),
          map(({dto: patchedDto, attachmentsData}) => {
            const document = convertDocumentDtoToModel(patchedDto, correlationId);
            const createdAttachments = collectCreatedAttachments(attachmentsData);
            const shouldCreateAttachmentsNumber = shouldCreateFilesNumber(data);
            const uncreatedAttachments = shouldCreateAttachmentsNumber - createdAttachments.length;
            return {document, createdAttachments, uncreatedAttachments};
          })
        )
      )
    );
  }

  public updateWithAdditionalData(
    dto: DocumentDto,
    workspace: Workspace,
    data: DocumentAdditionalDataRequest,
    correlationId: string
  ): Observable<{
    document: DocumentModel;
    createdAttachments: FileAttachment[];
    uncreatedAttachments: number;
    deletedAttachments: string[];
    undeletedAttachments: number;
  }> {
    return this.createDocumentAttachments(dto, data, workspace).pipe(
      mergeMap(created => this.deleteDocumentAttachments(data, workspace).pipe(map(deleted => ({created, deleted})))),
      withLatestFrom(this.selectFileAttachments$(dto)),
      mergeMap(([attachmentsData, documentAttachments]) =>
        this.updateDocumentAndChangedAttachments(dto, workspace, attachmentsData, documentAttachments)
      ),
      map(({dto: updatedDto, attachmentsData}) => {
        const document = convertDocumentDtoToModel(updatedDto, correlationId);

        const createdAttachments = collectCreatedAttachments(attachmentsData);
        const shouldCreateAttachmentsNumber = shouldCreateFilesNumber(data);
        const uncreatedAttachments = shouldCreateAttachmentsNumber - createdAttachments.length;

        const deletedAttachments = collectDeletedAttachments(attachmentsData);
        const shouldDeleteAttachmentsNumber = shouldDeleteFilesNumber(data);
        const undeletedAttachments = shouldDeleteAttachmentsNumber - deletedAttachments.length;

        return {document, createdAttachments, uncreatedAttachments, deletedAttachments, undeletedAttachments};
      })
    );
  }

  private selectFileAttachments$(dto: DocumentDto): Observable<FileAttachment[]> {
    const documentAttachmentsCursor: DataCursor = {
      documentId: dto.id,
      collectionId: dto.collectionId,
    };

    return this.store$.pipe(select(selectFileAttachmentsByDataCursor(documentAttachmentsCursor)));
  }

  private updateDocumentAndChangedAttachments(
    dto: DocumentDto,
    workspace: Workspace,
    attachmentsData: ChangedAttachmentsData,
    documentFileAttachments: FileAttachment[]
  ): Observable<{dto: DocumentDto; attachmentsData: ChangedAttachmentsData}> {
    const patchData = createPatchData(attachmentsData, documentFileAttachments);
    const patchedDto = {...dto, data: {...dto.data, ...patchData}};

    return this.service.updateDocumentData(patchedDto, workspace).pipe(map(newDto => ({dto: newDto, attachmentsData})));
  }

  private patchCreatedAttachments(
    dto: DocumentDto,
    workspace: Workspace,
    attachmentsData: ChangedAttachmentsData
  ): Observable<{dto: DocumentDto; attachmentsData: ChangedAttachmentsData}> {
    const patchData = createPatchData(attachmentsData, []);

    if (Object.keys(patchData).length > 0) {
      const patchDto = {...dto, data: patchData};
      return this.service.patchDocumentData(patchDto, workspace).pipe(
        catchError(() => of(dto)),
        map(newDto => ({...newDto, data: {...dto.data, ...patchData}})),
        map(newDto => ({dto: newDto, attachmentsData}))
      );
    }

    return of({dto, attachmentsData});
  }

  private createDocumentAttachments(
    dto: DocumentDto,
    data: DocumentAdditionalDataRequest,
    workspace: Workspace
  ): Observable<CreatedAttachmentsData> {
    const {fileAttachments, files} = collectFilesAndAttachments(dto, data);
    if (fileAttachments.length === 0) {
      return of({});
    }

    const path = createFileApiPath(workspace, fileAttachments[0]);
    const dtos = fileAttachments.map(fileAttachment => convertFileAttachmentModelToDto(fileAttachment, workspace));

    return this.attachmentService.createFiles(path, dtos).pipe(
      catchError(() => of([])),
      mergeMap(newAttachments => {
        const attachmentRequests: Observable<FileAttachment>[] = newAttachments.map((fileAttachment, index) =>
          this.fileApiService.uploadFile(fileAttachment.presignedUrl, files[index].type, files[index]).pipe(
            map(() => fileAttachment),
            catchError(() => of(null))
          )
        );
        if (attachmentRequests.length > 0) {
          return zip(attachmentRequests).pipe(
            map(results =>
              results
                .filter(result => !!result)
                .reduce((map, result) => {
                  if (map[result.attributeId]) {
                    map[result.attributeId].push(result);
                  }
                  map[result.attributeId] = [result];
                  return map;
                }, {})
            )
          );
        }
        return of({});
      })
    );
  }

  private deleteDocumentAttachments(
    data: DocumentAdditionalDataRequest,
    workspace: Workspace
  ): Observable<DeletedAttachmentsData> {
    const ids = collectFileIds(data);
    if (ids.length === 0) {
      return of({});
    }

    return this.attachmentService.removeFiles(workspace, ids).pipe(
      map(() => data.deleteFilesMap),
      catchError(() => of({}))
    );
  }
}

type CreatedAttachmentsData = Record<string, FileAttachment[]>;
type DeletedAttachmentsData = Record<string, string[]>;

interface ChangedAttachmentsData {
  created: CreatedAttachmentsData;
  deleted?: DeletedAttachmentsData;
}

function createPatchData(
  changedAttachmentsData: ChangedAttachmentsData,
  documentFileAttachments: FileAttachment[]
): DataResourceData {
  const attributeIds = uniqueValues([
    ...Object.keys(changedAttachmentsData?.created || {}),
    ...Object.keys(changedAttachmentsData?.deleted || {}),
  ]);

  return attributeIds.reduce((data, attributeId) => {
    const attachments = changedAttachmentsData.created[attributeId] || [];
    const deletedAttachments = changedAttachmentsData.deleted[attributeId] || [];

    const attributeAttachments = documentFileAttachments.filter(
      attachment => attachment.attributeId === attributeId && !deletedAttachments.includes(attachment.id)
    );
    attachments.push(...attributeAttachments);

    data[attributeId] = attachments.map(attachment => attachment.fileName).join(',');

    return data;
  }, {});
}

function collectCreatedAttachments(changedAttachmentsData: ChangedAttachmentsData): FileAttachment[] {
  return Object.keys(changedAttachmentsData?.created || {}).reduce((data, attributeId) => {
    const attachments = changedAttachmentsData.created[attributeId] || [];
    data.push(...attachments);
    return data;
  }, []);
}

function collectDeletedAttachments(changedAttachmentsData: ChangedAttachmentsData): string[] {
  return Object.keys(changedAttachmentsData?.deleted || {}).reduce((data, attributeId) => {
    const ids = changedAttachmentsData.deleted[attributeId] || [];
    data.push(...ids);
    return data;
  }, []);
}

function collectFilesAndAttachments(
  dto: DocumentDto,
  data: DocumentAdditionalDataRequest
): {fileAttachments: FileAttachment[]; files: File[]} {
  return Object.keys(data.createFilesMap || {}).reduce(
    (result, attributeId) => {
      const files = data.createFilesMap[attributeId] || [];
      const fileAttachments: FileAttachment[] = files.map(file => ({
        collectionId: dto.collectionId,
        documentId: dto.id,
        attributeId,
        attachmentType: FileAttachmentType.Document,
        fileName: file.name,
      }));

      result.fileAttachments.push(...fileAttachments);
      result.files.push(...files);
      return result;
    },
    {fileAttachments: [], files: []}
  );
}

function collectFileIds(data: DocumentAdditionalDataRequest): string[] {
  return Object.keys(data.deleteFilesMap || {}).reduce((result, attributeId) => {
    const ids = data.deleteFilesMap[attributeId] || [];
    result.push(...ids);
    return result;
  }, []);
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
