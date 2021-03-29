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
import {AuditLogService} from './audit-log.service';
import {Observable, of} from 'rxjs';
import {AuditLogDto} from '../../dto/audit-log.dto';
import {DocumentDto, LinkInstanceDto} from '../../dto';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../store/app.state';
import {selectDocumentById} from '../../store/documents/documents.state';
import {map, take} from 'rxjs/operators';
import {DocumentModel} from '../../store/documents/document.model';
import {convertDocumentModelToDto} from '../../store/documents/document.converter';
import {selectLinkInstanceById} from '../../store/link-instances/link-instances.state';
import {LinkInstance} from '../../store/link-instances/link.instance';
import {convertLinkInstanceModelToDto} from '../../store/link-instances/link-instance.converter';

@Injectable()
export class PublicAuditLogService implements AuditLogService {
  constructor(private store$: Store<AppState>) {}

  public getByDocument(collectionId: string, documentId: string): Observable<AuditLogDto[]> {
    return of([]);
  }

  public getByLink(linkTypeId: string, linkInstanceId: string): Observable<AuditLogDto[]> {
    return of([]);
  }

  public revertDocument(collectionId: string, documentId: string, auditLogId: string): Observable<DocumentDto> {
    return this.store$.pipe(
      select(selectDocumentById(documentId)),
      take(1),
      map(model => this.convertDocumentModelToDto(model))
    );
  }

  private convertDocumentModelToDto(model: DocumentModel): DocumentDto {
    return (
      model && {
        ...convertDocumentModelToDto(model),
        creationDate: model.creationDate?.getTime(),
        dataVersion: model.dataVersion || 0,
        updateDate: model.updateDate?.getTime(),
      }
    );
  }

  public revertLink(linkTypeId: string, linkInstanceId: string, auditLogId: string): Observable<LinkInstanceDto> {
    return this.store$.pipe(
      select(selectLinkInstanceById(linkInstanceId)),
      take(1),
      map(model => this.convertLinkInstanceModelToDto(model))
    );
  }

  private convertLinkInstanceModelToDto(model: LinkInstance): LinkInstanceDto {
    return (
      model && {
        ...convertLinkInstanceModelToDto(model),
        creationDate: model.creationDate?.getTime(),
        dataVersion: model.dataVersion || 0,
        updateDate: model.updateDate?.getTime(),
      }
    );
  }
}
