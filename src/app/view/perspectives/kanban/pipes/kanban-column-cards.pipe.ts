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
import {KanbanColumn, KanbanConfig, KanbanStemConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {KanbanCard} from '../columns/column/kanban-column.component';
import {isNotNullOrUndefined, objectsByIdMap} from '../../../../shared/utils/common.utils';
import * as moment from 'moment';
import {Collection} from '../../../../core/store/collections/collection';
import {ConstraintType} from '../../../../core/model/data/constraint';
import {DateTimeConstraintConfig} from '../../../../core/model/data/constraint-config';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {createDateTimeOptions} from '../../../../shared/date-time/date-time-options';
import {parseDateTimeByConstraint} from '../../../../shared/utils/date.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {AllowedPermissions, mergeAllowedPermissions} from '../../../../core/model/allowed-permissions';

@Pipe({
  name: 'kanbanColumnCards',
})
export class KanbanColumnCardsPipe implements PipeTransform {
  public transform(
    config: KanbanConfig,
    column: KanbanColumn,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    permissionsMap: Record<string, AllowedPermissions>
  ): KanbanCard[] {
    if (!column || !column.resourcesOrder || column.resourcesOrder.length === 0) {
      return [];
    }

    const collectionsMap = objectsByIdMap(collections);
    const documentsMap = objectsByIdMap(documents);
    const linkTypesMap = objectsByIdMap(linkTypes);
    const linkInstancesMap = objectsByIdMap(linkInstances);

    return column.resourcesOrder.reduce<KanbanCard[]>((arr, order) => {
      const dataResource =
        order.resourceType === AttributesResourceType.Collection ? documentsMap[order.id] : linkInstancesMap[order.id];
      if (dataResource) {
        const {resource, permissions} = this.getResource(
          order.resourceType,
          dataResource,
          collectionsMap,
          linkTypesMap,
          permissionsMap
        );

        const stemsConfigs = config?.stemsConfigs || [];

        const dueHours =
          isNotNullOrUndefined(order.stemIndex) &&
          ((stemsConfigs[order.stemIndex] && stemsConfigs[order.stemIndex].doneColumnTitles) || []).indexOf(
            column.title
          ) < 0
            ? this.getDueHours(dataResource, resource, stemsConfigs[order.stemIndex])
            : null;

        arr.push({
          attributeId: order.attributeId,
          dataResource,
          dueHours,
          resourceType: order.resourceType,
          permissions,
          resource,
        });
      }
      return arr;
    }, []);
  }

  private getResource(
    resourceType: AttributesResourceType,
    dataResource: DataResource,
    collectionsMap: Record<string, Collection>,
    linkTypesMap: Record<string, LinkType>,
    permissionsMap: Record<string, AllowedPermissions>
  ): {resource?: AttributesResource; permissions?: AllowedPermissions} {
    if (resourceType === AttributesResourceType.Collection) {
      const resource = collectionsMap[(<DocumentModel>dataResource).collectionId];
      const permissions = permissionsMap[resource?.id];
      return {resource, permissions};
    } else if (resourceType === AttributesResourceType.LinkType) {
      const linkType = linkTypesMap[(<LinkInstance>dataResource).linkTypeId];
      const collections = <[Collection, Collection]>linkType?.collectionIds?.map(id => collectionsMap[id]) || [];
      const resource = {...linkType, collections};
      const permissions = mergeAllowedPermissions(
        permissionsMap[collections[0]?.id],
        permissionsMap[collections[1]?.id]
      );
      return {resource, permissions};
    }
    return {};
  }

  private getDueHours(dataResource: DataResource, resource: AttributesResource, stemConfig: KanbanStemConfig): number {
    if (stemConfig?.dueDate?.attributeId && isNotNullOrUndefined(dataResource.data?.[stemConfig.dueDate.attributeId])) {
      let expectedFormat = null;
      const constraint = findAttributeConstraint(resource?.attributes, stemConfig.dueDate.attributeId);
      if (constraint && constraint.type === ConstraintType.DateTime) {
        expectedFormat = (constraint.config as DateTimeConstraintConfig).format;
      }

      const parsedDate = parseDateTimeByConstraint(dataResource.data[stemConfig.dueDate.attributeId], constraint);
      const dueDate = this.checkDueDate(parsedDate, expectedFormat);

      return moment(dueDate).diff(moment(), 'hours', true);
    }

    return null;
  }

  private checkDueDate(dueDate: Date, format: string): Date {
    if (!dueDate || !format) {
      return dueDate;
    }

    const options = createDateTimeOptions(format);
    if (options.hours) {
      return dueDate;
    }

    return moment(dueDate)
      .endOf('day')
      .toDate();
  }
}
