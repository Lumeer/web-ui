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
import {AttributesResourceType} from '../../../../core/model/resource';
import {KanbanCard} from '../columns/column/kanban-column.component';
import {parseDateTimeDataValue} from '../../../../shared/utils/data.utils';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import * as moment from 'moment';
import {Collection} from '../../../../core/store/collections/collection';
import {ConstraintType} from '../../../../core/model/data/constraint';
import {DateTimeConstraintConfig} from '../../../../core/model/data/constraint-config';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';

@Pipe({
  name: 'kanbanColumnCards',
})
export class KanbanColumnCardsPipe implements PipeTransform {
  public transform(
    column: KanbanColumn,
    documents: DocumentModel[],
    collections: Collection[],
    config: KanbanConfig
  ): KanbanCard[] {
    if (!column || !column.resourcesOrder || column.resourcesOrder.length === 0) {
      return [];
    }

    const documentMap = (documents || []).reduce<Record<string, DocumentModel>>((docsMap, doc) => {
      docsMap[doc.id] = doc;
      return docsMap;
    }, {});

    return column.resourcesOrder.reduce<KanbanCard[]>((arr, order) => {
      // for now we support only documents
      if (order.resourceType === AttributesResourceType.Collection && documentMap[order.id]) {
        const document = documentMap[order.id];
        const stemsConfigs = (config && config.stemsConfigs) || [];

        arr.push({
          attributeId: order.attributeId,
          dataResource: document,
          dueHours:
            isNotNullOrUndefined(order.stemIndex) &&
            stemsConfigs[order.stemIndex] &&
            stemsConfigs[order.stemIndex].doneColumnTitles &&
            stemsConfigs[order.stemIndex].doneColumnTitles.indexOf(column.title) < 0 &&
            this.getDueHours(document, collections, stemsConfigs[order.stemIndex]),
        });
      }
      return arr;
    }, []);
  }

  private getDueHours(document: DocumentModel, collections: Collection[], stemConfig: KanbanStemConfig): number {
    if (
      stemConfig &&
      stemConfig.dueDate &&
      stemConfig.dueDate.attributeId &&
      document.data[stemConfig.dueDate.attributeId]
    ) {
      const collection = collections.find(c => c.id === document.collectionId);

      if (collection) {
        let expectedFormat = null;
        const constraint = findAttributeConstraint(collection.attributes, stemConfig.dueDate.attributeId);
        if (constraint && constraint.type === ConstraintType.DateTime) {
          expectedFormat = (constraint.config as DateTimeConstraintConfig).format;
        }

        const dueDate = parseDateTimeDataValue(document.data[stemConfig.dueDate.attributeId], expectedFormat);

        return moment(dueDate).diff(moment(), 'hours');
      }
    }

    return null;
  }
}
