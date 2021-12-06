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
import {mergeMap, Observable, of, switchMap, zip} from 'rxjs';
import {AttachmentsService, DocumentService, LinkInstanceService} from '../data-service';
import {FileApiService} from './file-api.service';
import {Workspace} from '../store/navigation/workspace';
import {catchError, map, take, withLatestFrom} from 'rxjs/operators';
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
import {LinkInstance} from '../store/link-instances/link.instance';
import {selectLinkInstancesByTypeAndDocuments} from '../store/link-instances/link-instances.state';
import {isAnyDocumentInLinkInstance} from '../store/link-instances/link-instance.utils';
import {DocumentLinksDto} from '../dto/document-links.dto';
import {
  convertLinkInstanceDtoToModel,
  convertLinkInstanceModelToDto,
} from '../store/link-instances/link-instance.converter';
import {createFileAttachmentUniqueName} from '../store/file-attachments/file-attachment.utils';

@Injectable({
  providedIn: 'root',
})
export class DocumentUtilsService {
  constructor(
    private store$: Store<AppState>,
    private service: DocumentService,
    private attachmentService: AttachmentsService,
    private fileApiService: FileApiService,
    private linkInstanceService: LinkInstanceService
  ) {}

  public createWithAdditionalData(
    dto: DocumentDto,
    workspace: Workspace,
    data: DocumentAdditionalDataRequest,
    correlationId: string
  ): Observable<DocumentWithAdditionalDataStats & {document: DocumentModel}> {
    return this.service.createDocument(dto, workspace).pipe(
      mergeMap(createdDto =>
        this.createDocumentAttachments(createdDto, data, workspace).pipe(
          mergeMap(created => this.patchCreatedAttachments(createdDto, workspace, {created})),
          mergeMap(result =>
            this.setDocumentLinks(createdDto, data, workspace).pipe(map(linksData => ({...result, linksData})))
          ),
          map(({dto: patchedDto, attachmentsData, linksData}) => {
            const document = convertDocumentDtoToModel(patchedDto, correlationId);
            return {document, ...collectionDocumentWithAdditionalDataStats(data, attachmentsData, linksData)};
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
  ): Observable<DocumentWithAdditionalDataStats & {document: DocumentModel}> {
    return this.createDocumentAttachments(dto, data, workspace).pipe(
      mergeMap(created => this.deleteDocumentAttachments(data, workspace).pipe(map(deleted => ({created, deleted})))),
      withLatestFrom(this.selectFileAttachments$(dto)),
      mergeMap(([attachmentsData, documentAttachments]) =>
        this.updateDocumentAndChangedAttachments(dto, workspace, attachmentsData, documentAttachments)
      ),
      mergeMap(result =>
        this.setDocumentLinks(result.dto, data, workspace).pipe(map(linksData => ({...result, linksData})))
      ),
      map(({dto: updatedDto, attachmentsData, linksData}) => {
        const document = convertDocumentDtoToModel(updatedDto, correlationId);
        return {document, ...collectionDocumentWithAdditionalDataStats(data, attachmentsData, linksData)};
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
                  if (!map[result.attributeId]) {
                    map[result.attributeId] = [];
                  }
                  map[result.attributeId].push(result);
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

  private setDocumentLinks(
    dto: DocumentDto,
    data: DocumentAdditionalDataRequest,
    workspace: Workspace
  ): Observable<ChangedLinksData> {
    const requests = Object.keys(data.linkDocumentIdsChangeMap || []).map(linkTypeId => {
      const addedDocumentIds = data.linkDocumentIdsChangeMap[linkTypeId].addedDocumentIds;
      const removedDocumentIds = data.linkDocumentIdsChangeMap[linkTypeId].removedDocumentIds;

      return this.store$.pipe(
        select(selectLinkInstancesByTypeAndDocuments(linkTypeId, [dto.id])),
        take(1),
        switchMap(linkInstances => {
          const removedLinkInstancesIds = linkInstances
            .filter(linkInstance => isAnyDocumentInLinkInstance(linkInstance, removedDocumentIds))
            .map(linkInstance => linkInstance.id);
          const createdLinkInstances: LinkInstance[] = addedDocumentIds.map(documentId => ({
            id: null,
            documentIds: [documentId, dto.id],
            linkTypeId,
            data: {},
          }));

          if (createdLinkInstances.length > 0 || removedLinkInstancesIds.length > 0) {
            const documentLinksDto: DocumentLinksDto = {
              documentId: dto.id,
              removedLinkInstancesIds,
              createdLinkInstances: createdLinkInstances.map(linkInstance =>
                convertLinkInstanceModelToDto(linkInstance)
              ),
            };

            return this.linkInstanceService.setDocumentLinks(linkTypeId, documentLinksDto, workspace).pipe(
              catchError(() => of([])),
              map(dtos => dtos.map(dto => convertLinkInstanceDtoToModel(dto))),
              map(createdLinkInstances => ({createdLinkInstances, removedLinkInstancesIds}))
            );
          } else {
            return of({createdLinkInstances: [], removedLinkInstancesIds: []});
          }
        })
      );
    });

    if (requests.length > 0) {
      return zip(requests).pipe(
        map(results =>
          results.reduce(
            (data, result) => {
              data.created.push(...result.createdLinkInstances);
              data.removed.push(...result.removedLinkInstancesIds);

              return data;
            },
            {created: [], removed: []}
          )
        )
      );
    }

    return of({created: [], deleted: []});
  }
}

interface DocumentWithAdditionalDataStats {
  createdAttachments: FileAttachment[];
  unCreatedAttachments: number;

  deletedAttachments?: string[];
  unDeletedAttachments?: number;

  createdLinkInstances: LinkInstance[];
  unCreatedLinkInstances: number;

  removedLinkInstancesIds?: string[];
  unRemovedLinkInstances?: number;
}

function collectionDocumentWithAdditionalDataStats(
  data: DocumentAdditionalDataRequest,
  attachmentsData: ChangedAttachmentsData,
  linksData: ChangedLinksData
): DocumentWithAdditionalDataStats {
  const createdAttachments = collectCreatedAttachments(attachmentsData);
  const shouldCreateFilesNum = shouldCreateFilesNumber(data);
  const unCreatedAttachments = shouldCreateFilesNum - createdAttachments.length;

  const deletedAttachments = collectDeletedAttachments(attachmentsData);
  const shouldDeleteAttachmentsNumber = shouldDeleteFilesNumber(data);
  const unDeletedAttachments = shouldDeleteAttachmentsNumber - deletedAttachments.length;

  const createdLinkInstances = linksData.created || [];
  const shouldCreateLinksNum = shouldCreateLinksNumber(data);
  const unCreatedLinkInstances = shouldCreateLinksNum - createdLinkInstances.length;

  const removedLinkInstancesIds = linksData.deleted || [];
  const shouldRemoveLinksNum = shouldDeleteLinksNumber(data);
  const unRemovedLinkInstances = shouldRemoveLinksNum - removedLinkInstancesIds.length;

  return {
    createdAttachments,
    unCreatedAttachments,
    deletedAttachments,
    unDeletedAttachments,
    createdLinkInstances,
    unCreatedLinkInstances,
    removedLinkInstancesIds,
    unRemovedLinkInstances,
  };
}

type CreatedAttachmentsData = Record<string, FileAttachment[]>;
type DeletedAttachmentsData = Record<string, string[]>;

interface ChangedAttachmentsData {
  created: CreatedAttachmentsData;
  deleted?: DeletedAttachmentsData;
}

type CreatedLinksData = LinkInstance[];
type RemovedLinksData = string[];

interface ChangedLinksData {
  created: CreatedLinksData;
  deleted?: RemovedLinksData;
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
        uniqueName: createFileAttachmentUniqueName(file.name),
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

function shouldCreateLinksNumber(data: DocumentAdditionalDataRequest): number {
  return Object.keys(data.linkDocumentIdsChangeMap || {}).reduce((num, linkTypeId) => {
    return num + (data.linkDocumentIdsChangeMap?.[linkTypeId]?.addedDocumentIds || []).length;
  }, 0);
}

function shouldDeleteFilesNumber(data: DocumentAdditionalDataRequest): number {
  return Object.keys(data.deleteFilesMap || {}).reduce((num, attributeId) => {
    return num + (data.deleteFilesMap[attributeId] || []).length;
  }, 0);
}

function shouldDeleteLinksNumber(data: DocumentAdditionalDataRequest): number {
  return Object.keys(data.linkDocumentIdsChangeMap || {}).reduce((num, linkTypeId) => {
    return num + (data.linkDocumentIdsChangeMap?.[linkTypeId]?.removedDocumentIds || []).length;
  }, 0);
}
