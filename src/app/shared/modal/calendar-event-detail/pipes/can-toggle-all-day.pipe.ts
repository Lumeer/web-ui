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
import {CalendarConfig} from '../../../../core/store/calendars/calendar';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {uniqueValues} from '../../../utils/array.utils';
import {AttributesResourceType} from '../../../../core/model/resource';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {ConstraintType} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {calendarStemConfigIsWritable} from '../../../../view/perspectives/calendar/util/calendar-util';
import {objectsByIdMap} from '../../../utils/common.utils';

@Pipe({
  name: 'canToggleAllDay',
})
export class CanToggleAllDayPipe implements PipeTransform {
  public transform(
    config: CalendarConfig,
    stemIndex: number,
    collections: Collection[],
    linkTypes: LinkType[],
    permissions: Record<string, AllowedPermissions>
  ): boolean {
    const stemConfig = config.stemsConfigs?.[stemIndex];
    const linkTypesMap = objectsByIdMap(linkTypes);
    if (!stemConfig || !calendarStemConfigIsWritable(stemConfig, permissions, linkTypesMap)) {
      return false;
    }

    const resourceIds = [stemConfig.name, stemConfig.start, stemConfig.end]
      .filter(bar => !!bar)
      .map(bar => `${bar.resourceType}:${bar.resourceId}`);

    if (uniqueValues(resourceIds).length !== 1) {
      return false;
    }

    if (stemConfig.end) {
      const resource =
        stemConfig.end.resourceType === AttributesResourceType.Collection
          ? (collections || []).find(coll => coll.id === stemConfig.end.resourceId)
          : linkTypesMap[stemConfig.end.resourceId];
      const constraint = findAttributeConstraint(resource?.attributes, stemConfig.end.attributeId);
      return !constraint || constraint.type !== ConstraintType.Duration;
    }

    return true;
  }
}
