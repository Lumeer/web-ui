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
import {Collection, CollectionPurposeType} from '../../../../../core/store/collections/collection';
import {TaskAttributes} from '../model/task-attributes';
import {findAttribute, getDefaultAttributeId} from '../../../../../core/store/collections/collection.util';

@Pipe({
  name: 'collectionTaskAttributes',
})
export class CollectionsTaskAttributesPipe implements PipeTransform {
  public transform(collections: Collection[]): Record<string, TaskAttributes> {
    return collections.reduce<Record<string, TaskAttributes>>((map, collection) => {
      if (collection?.purpose?.type === CollectionPurposeType.Tasks) {
        const defaultAttributeId = getDefaultAttributeId(collection);
        const taskAttributes: TaskAttributes = {
          title: findAttribute(collection.attributes, defaultAttributeId),
          assignee: findAttribute(collection.attributes, collection.purpose.metaData.assigneeAttributeId),
          dueDate: findAttribute(collection.attributes, collection.purpose.metaData.dueDateAttributeId),
          priority: findAttribute(collection.attributes, collection.purpose.metaData.priorityAttributeId),
          tags: findAttribute(collection.attributes, collection.purpose.metaData.tagsAttributeId),
        };
        const usedAttributes = [
          taskAttributes.title?.id,
          taskAttributes.assignee?.id,
          taskAttributes.dueDate?.id,
          taskAttributes.priority?.id,
          taskAttributes.tags?.id,
        ].filter(attributeId => !!attributeId);

        taskAttributes.usedAttributes = new Set(usedAttributes);
        map[collection.id] = taskAttributes;
      } else {
        map[collection.id] = {};
      }
      return map;
    }, {});
  }
}
