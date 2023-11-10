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

import {FileAttachment} from './file-attachment.model';
import {FileApiPath} from '../../data-service/attachments/attachments.service';
import {generateId} from '../../../shared/utils/resource.utils';

export function getFileTypeIcon(fileName: string): string {
  if (!fileName) {
    return 'fa-file';
  }

  if (fileName.match(/^.+\.(txt|log)$/)) {
    return 'fa-file-alt';
  }

  if (fileName.match(/^.+\.(zip|war|jar|rar|gz|7z)$/)) {
    return 'fa-file-archive';
  }

  if (fileName.match(/^.+\.(aac|ogg|mp3|wma)$/)) {
    return 'fa-file-audio';
  }

  if (fileName.match(/^.+\.(java|js|ts|c|cpp|html|xhtml|css|scss|less|php)$/)) {
    return 'fa-file-code';
  }

  if (fileName.match(/^.+\.(xls|xlsx|ods|csv)$/)) {
    return 'fa-file-excel';
  }

  if (fileName.match(/^.+\.(jpg|jpeg|png|svg|tiff|gif|bmp|webp)$/)) {
    return 'fa-file-image';
  }

  if (fileName.match(/^.+\.(pdf)$/)) {
    return 'fa-file-pdf';
  }

  if (fileName.match(/^.+\.(ppt|pptx|odp)$/)) {
    return 'fa-file-powerpoint';
  }

  if (fileName.match(/^.+\.(avi|mkv|mov|webm)$/)) {
    return 'fa-file-video';
  }

  if (fileName.match(/^.+\.(doc|docx|odt)$/)) {
    return 'fa-file-word';
  }

  return 'fa-file';
}

export function createFileAttachmentUniqueName(name: string): string {
  const suffixIndex = name.lastIndexOf('.');
  if (suffixIndex !== -1) {
    return `${name.substring(0, suffixIndex)}_${generateId()}${name.substring(suffixIndex)}`;
  }
  return `${name}_${generateId()}`;
}

export function fileAttachmentHasApiPath(attachment: FileAttachment, path: FileApiPath): boolean {
  return (
    attachment.organizationId === path.organizationId &&
    attachment.projectId === path.projectId &&
    (attachment.collectionId || '') === (path.collectionId || '') &&
    (attachment.documentId || '') === (path.documentId || '') &&
    (attachment.linkTypeId || '') === (path.linkTypeId || '') &&
    (attachment.linkInstanceId || '') === (path.linkInstanceId || '')
  );
}

export function isOnlyCollectionApiPath(path: FileApiPath): boolean {
  return path.collectionId && !path.documentId && !path.attributeId;
}

export function isOnlyLinkTypeApiPath(path: FileApiPath): boolean {
  return path.linkTypeId && !path.linkInstanceId && !path.attributeId;
}
