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

import {FileAttachmentDto} from '../../dto/file-attachment.dto';
import {Workspace} from '../navigation/workspace';
import {FileAttachment, FileAttachmentType, fileAttachmentTypesMap} from './file-attachment.model';

export function convertFileAttachmentDtoToModel(dto: FileAttachmentDto, uploading?: boolean): FileAttachment {
  const attachmentType: FileAttachmentType = fileAttachmentTypesMap[dto.attachmentType];

  return {
    id: dto.id,
    organizationId: dto.organizationId,
    projectId: dto.projectId,
    collectionId: attachmentType === FileAttachmentType.Document ? dto.collectionId : undefined,
    documentId: attachmentType === FileAttachmentType.Document ? dto.documentId : undefined,
    linkTypeId: attachmentType === FileAttachmentType.Link ? dto.collectionId : undefined,
    linkInstanceId: attachmentType === FileAttachmentType.Link ? dto.documentId : undefined,
    attributeId: dto.attributeId,
    fileName: dto.fileName,
    uniqueName: dto.uniqueName || dto.fileName,
    attachmentType,
    presignedUrl: dto.presignedUrl,
    size: dto.size,
    createdBy: dto.createdBy,
    creationDate: dto.creationDate ? new Date(dto.creationDate) : null,
    uploading,
    refreshTime: new Date(),
  };
}

export function convertFileAttachmentModelToDto(model: FileAttachment, workspace?: Workspace): FileAttachmentDto {
  return {
    id: model.id,
    organizationId: workspace ? workspace.organizationId : model.organizationId,
    projectId: workspace ? workspace.projectId : model.projectId,
    collectionId: model.collectionId || model.linkTypeId,
    documentId: model.documentId || model.linkInstanceId,
    attributeId: model.attributeId,
    fileName: model.fileName,
    uniqueName: model.uniqueName,
    attachmentType: model.attachmentType,
    presignedUrl: model.presignedUrl,
    size: model.size,
  };
}
