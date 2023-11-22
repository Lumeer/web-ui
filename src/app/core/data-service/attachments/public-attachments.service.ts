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
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {ConfigurationService} from '../../../configuration/configuration.service';
import {generateId} from '../../../shared/utils/resource.utils';
import {FileAttachmentDto} from '../../dto/file-attachment.dto';
import {AttachmentsService, FileApiPath} from './attachments.service';

@Injectable()
export class PublicAttachmentsService implements AttachmentsService {
  constructor(
    private http: HttpClient,
    private configurationService: ConfigurationService
  ) {}

  public createFiles(path: FileApiPath, files: FileAttachmentDto[]): Observable<FileAttachmentDto[]> {
    return of(files.map(file => ({...file, id: generateId()})));
  }

  public removeFile(path: Partial<FileApiPath>, fileId: string): Observable<any> {
    return of(fileId);
  }

  public removeFiles(path: Partial<FileApiPath>, fileIds: string[]): Observable<any> {
    return of(fileIds);
  }

  public getFilesByCollection(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return this.http
      .get<FileAttachmentDto[]>(`${this.filesUrl(path)}/collection/${path.collectionId}`)
      .pipe(catchError(() => of([])));
  }

  public getFilesByDocument(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return of([]);
  }

  public getFilesByDocumentAttribute(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return of([]);
  }

  public getFilesWithDetailsByDocumentAttribute(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return of([]);
  }

  public getFilesByLinkType(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return this.http
      .get<FileAttachmentDto[]>(`${this.filesUrl(path)}/link/${path.linkTypeId}`)
      .pipe(catchError(() => of([])));
  }

  public getFilesByLinkInstance(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return of([]);
  }

  public getFilesByLinkInstanceAttribute(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return of([]);
  }

  public getFilesWithDetailsByLinkInstanceAttribute(path: FileApiPath): Observable<FileAttachmentDto[]> {
    return of([]);
  }

  private filesUrl(workspace: Partial<FileApiPath>): string {
    return `${this.configurationService.getConfiguration().apiUrl}/rest/p/organizations/${
      workspace.organizationId
    }/projects/${workspace.projectId}/files`;
  }
}
