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

import {
  ConditionType,
  ConstraintData,
  SelectConstraint,
  UserConstraint,
  UserConstraintType,
} from '@lumeer/data-filters';
import {AuditLog, AuditLogType} from '../../../../../core/store/audit-logs/audit-log.model';
import {parseSelectTranslation} from '../../../../utils/translation.utils';

export interface AuditLogFilters {
  users: string[];
  types: AuditLogType[];
}

export const auditLogUsersFilterConstraint = new UserConstraint({
  multi: true,
  externalUsers: false,
  type: UserConstraintType.UsersAndTeams,
});

export const auditLogTypeFilterConstraint = new SelectConstraint({
  multi: true,
  options: [
    {value: AuditLogType.Created, displayValue: translateAuditType(AuditLogType.Created)},
    {value: AuditLogType.Updated, displayValue: translateAuditType(AuditLogType.Updated)},
    {value: AuditLogType.Deleted, displayValue: translateAuditType(AuditLogType.Deleted)},
  ],
  displayValues: false,
});

function translateAuditType(type: AuditLogType): string {
  return parseSelectTranslation(
    '@@audit.title.data.update2:{type, select, Updated {Updated} Created {Created} Deleted {Deleted}}',
    {
      type,
    }
  );
}

export function filterAuditLogs(
  logs: AuditLog[],
  filters: AuditLogFilters,
  constraintData: ConstraintData
): AuditLog[] {
  const userFilterDataValue = filters.users?.length
    ? auditLogUsersFilterConstraint.createDataValue(filters.users, constraintData)
    : null;

  return (logs || []).filter(log => {
    if (userFilterDataValue) {
      return userFilterDataValue.meetCondition(ConditionType.HasSome, [{value: log.userId}]);
    }
    if (filters.types?.length) {
      return filters.types.includes(log.type);
    }

    return true;
  });
}
