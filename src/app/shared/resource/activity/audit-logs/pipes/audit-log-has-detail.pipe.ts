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
import {Pipe, PipeTransform} from '@angular/core';

import {ResourceType} from '../../../../../core/model/resource-type';
import {AuditLog, AuditLogType} from '../../../../../core/store/audit-logs/audit-log.model';
import {findFirstAuditLogWithSameResource} from '../model/audit-log-filters';

@Pipe({
  name: 'auditLogHasDetail',
})
export class AuditLogHasDetailPipe implements PipeTransform {
  public transform(auditLog: AuditLog, allLogs: AuditLog[]): boolean {
    if (auditLog.resourceType === ResourceType.Document || auditLog.resourceType === ResourceType.Link) {
      if (auditLog.type === AuditLogType.Deleted) {
        return false;
      }

      const firstAuditLog = findFirstAuditLogWithSameResource(auditLog, allLogs);

      // we cannot show detail if document was deleted
      return firstAuditLog?.type !== AuditLogType.Deleted;
    }

    return false;
  }
}
