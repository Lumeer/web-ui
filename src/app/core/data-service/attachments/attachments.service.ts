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
import {FileAttachmentDto} from '../../dto/file-attachment.dto';
import {Workspace} from '../../store/navigation/workspace';
import {DataCursor} from '../../../shared/data-input/data-cursor';

export abstract class AttachmentsService {
  public abstract createFiles(path: FileApiPath, files: FileAttachmentDto[]): Observable<FileAttachmentDto[]>;

  public abstract removeFile(path: Partial<FileApiPath>, fileId: string): Observable<any>;

  public abstract getFilesByCollection(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesByDocument(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesByDocumentAttribute(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesWithDetailsByDocumentAttribute(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesByLinkType(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesByLinkInstance(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesByLinkInstanceAttribute(path: FileApiPath): Observable<FileAttachmentDto[]>;

  public abstract getFilesWithDetailsByLinkInstanceAttribute(path: FileApiPath): Observable<FileAttachmentDto[]>;
}

export type FileApiPath = Pick<Workspace, 'organizationId' | 'projectId'> & DataCursor;

export function createFileApiPath(
  workspace: Pick<Workspace, 'organizationId' | 'projectId'>,
  dataCursor: DataCursor
): FileApiPath {
  const {organizationId, projectId} = workspace;
  return {...dataCursor, organizationId, projectId};
}
