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
  SelectConstraintOption,
  UserConstraint,
  UserConstraintType,
} from '@lumeer/data-filters';
import {AuditLog, AuditLogType} from '../../../../../core/store/audit-logs/audit-log.model';
import {parseSelectTranslation} from '../../../../utils/translation.utils';
import {View} from '../../../../../core/store/views/view';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {ResourceType} from '../../../../../core/model/resource-type';

export interface AuditLogFilters {
  users?: string[];
  types?: AuditLogType[];
  views?: string[];
  collections?: string[];
  linkTypes?: string[];
}

export const auditLogUsersFilterConstraint = new UserConstraint({
  multi: true,
  externalUsers: false,
  type: UserConstraintType.UsersAndTeams,
});

export function auditLogTypeFilterConstraint(resourceType: ResourceType) {
  return new SelectConstraint({
    multi: true,
    options: [
      {value: AuditLogType.Created, displayValue: translateAuditType(AuditLogType.Created, resourceType)},
      {value: AuditLogType.Updated, displayValue: translateAuditType(AuditLogType.Updated, resourceType)},
      {value: AuditLogType.Deleted, displayValue: translateAuditType(AuditLogType.Deleted, resourceType)},
      {value: AuditLogType.Reverted, displayValue: translateAuditType(AuditLogType.Reverted, resourceType)},
      ...auditLogTypeResourceOptions(resourceType),
    ],
    displayValues: true,
  });
}

function auditLogTypeResourceOptions(resourceType: ResourceType): SelectConstraintOption[] {
  if (resourceType === ResourceType.Project) {
    return [{value: AuditLogType.Entered, displayValue: translateAuditType(AuditLogType.Entered, resourceType)}];
  }
  return [];
}

export function translateAuditType(type: AuditLogType, resourceType: ResourceType): string {
  if (resourceType === ResourceType.Project) {
    if (type === AuditLogType.Entered) {
      return $localize`:@@audit.title.project.enter:Entered Project`;
    }
  }

  return parseSelectTranslation(
    $localize`:@@audit.title.any.type:{type, select, Updated {Updated} Created {Created} Deleted {Deleted} Reverted {Reverted} Entered {Entered}}`,
    {type}
  );
}

export function filterAuditLogs(
  logs: AuditLog[],
  filters: AuditLogFilters,
  constraintData: ConstraintData,
  viewsMap: Record<string, View>,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): AuditLog[] {
  const userFilterDataValue = filters.users?.length
    ? auditLogUsersFilterConstraint.createDataValue(filters.users, constraintData)
    : null;

  return (logs || []).filter(log => {
    if (userFilterDataValue && !userFilterDataValue.meetCondition(ConditionType.HasSome, [{value: log.userId}])) {
      return false;
    }
    if (filters.types?.length && !filters.types.includes(log.type)) {
      return false;
    }
    if (filters.views?.length && (!log.viewId || (!filters.views.includes(log.viewId) && !!viewsMap[log.viewId]))) {
      return false;
    }
    if (!logMeetCollectionFilters(filters, log, collectionsMap)) {
      return false;
    }
    if (!logMeetLinkTypeFilters(filters, log, linkTypesMap)) {
      return false;
    }

    return true;
  });
}

function logMeetCollectionFilters(filters: AuditLogFilters, log: AuditLog, collectionsMap: Record<string, Collection>) {
  if (!filters.collections?.length) {
    return true;
  }

  if (
    log.resourceType === ResourceType.Document &&
    filters.collections.includes(log.parentId) &&
    !!collectionsMap[log.parentId]
  ) {
    return true;
  }

  return log.resourceType === ResourceType.Link && filters.linkTypes?.length;
}

function logMeetLinkTypeFilters(filters: AuditLogFilters, log: AuditLog, linkTypesMap: Record<string, LinkType>) {
  if (!filters.linkTypes?.length) {
    return true;
  }

  if (
    log.resourceType === ResourceType.Link &&
    filters.linkTypes.includes(log.parentId) &&
    !!linkTypesMap[log.parentId]
  ) {
    return true;
  }

  return log.resourceType === ResourceType.Document && filters.collections?.length;
}
