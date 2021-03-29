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
import {AuditLogDto} from '../../dto/audit-log.dto';
import {DocumentDto, LinkInstanceDto} from '../../dto';

export abstract class AuditLogService {
  public abstract getByDocument(collectionId: string, documentId: string): Observable<AuditLogDto[]>;

  public abstract revertDocument(collectionId: string, documentId: string, auditLogId: string): Observable<DocumentDto>;

  public abstract getByLink(linkTypeId: string, linkInstanceId: string): Observable<AuditLogDto[]>;

  public abstract revertLink(
    linkTypeId: string,
    linkInstanceId: string,
    auditLogId: string
  ): Observable<LinkInstanceDto>;
}
