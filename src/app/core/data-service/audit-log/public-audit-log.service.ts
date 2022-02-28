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

@Injectable()
export class PublicAuditLogService implements AuditLogService {
  public getByDocument(collectionId: string, documentId: string): Observable<AuditLogDto[]> {
    return of([]);
  }

  public getByLink(linkTypeId: string, linkInstanceId: string): Observable<AuditLogDto[]> {
    return of([]);
  }

  public getByCollection(collectionId: string): Observable<AuditLogDto[]> {
    return of([]);
  }

  public getByLinkType(linkTypeId: string): Observable<AuditLogDto[]> {
    return of([]);
  }

  public getByProject(): Observable<AuditLogDto[]> {
    return of([]);
  }

  public revert(auditLogId: string): Observable<any> {
    return of(true);
  }
}
