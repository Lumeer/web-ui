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

import {ConstraintData, DataObjectAggregator, DataObjectAttribute} from '@lumeer/data-filters';

import {AttributesResourceType} from '../../../../../core/model/resource';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {findAttribute} from '../../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {groupDocumentsByCollection} from '../../../../../core/store/documents/document.utils';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {TaskConfigAttribute, TasksConfigGroupBy} from '../../../../../core/store/searches/search';
import {objectValues} from '../../../../../shared/utils/common.utils';
import {TasksGroup} from '../model/tasks-group';

@Pipe({
  name: 'createTasksGroups',
})
export class CreateTasksGroupsPipe implements PipeTransform {
  private dataObjectAggregator = new DataObjectAggregator<string>();

  public transform(
    documents: DocumentModel[],
    collectionsMap: Record<string, Collection>,
    constraintData: ConstraintData,
    truncateContent: boolean,
    maxDocuments: number,
    groupBy: TasksConfigGroupBy
  ): TasksGroup[] {
    if (truncateContent) {
      return [{tasks: documents.slice(0, maxDocuments), truncated: documents.length > maxDocuments}];
    }
    const {pinned, other} = this.splitPinnedDocuments(documents);
    if (pinned.length) {
      return [
        {tasks: pinned, title: $localize`:@@pinned:Pinned`, titleClassList: 'fst-italic'},
        ...this.groupDocuments(other, collectionsMap, constraintData, groupBy, $localize`:@@other:Other`),
      ];
    }

    return [...this.groupDocuments(other, collectionsMap, constraintData, groupBy)];
  }

  private groupDocuments(
    documents: DocumentModel[],
    collectionsMap: Record<string, Collection>,
    constraintData: ConstraintData,
    groupBy: TasksConfigGroupBy,
    defaultTitle?: string
  ): TasksGroup[] {
    if (groupBy) {
      const documentsByCollection = groupDocumentsByCollection(documents);
      const groupsMap: Record<string, TasksGroup> = {};
      const usedDocumentsIds = new Set<string>();
      Object.keys(documentsByCollection).forEach(collectionId => {
        const collection = collectionsMap[collectionId];
        const stem: QueryStem = {collectionId: collection.id};
        const collectionDocuments = documentsByCollection[collectionId];
        this.dataObjectAggregator.updateData(
          [collection],
          collectionDocuments,
          [],
          [],
          stem,
          {collections: {}, linkTypes: {}},
          constraintData
        );
        const groupingAttribute = this.findGroupingAttribute(collection, groupBy);
        if (groupingAttribute) {
          const groupingObjectAttribute: DataObjectAttribute = {
            attributeId: groupingAttribute.id,
            key: groupBy,
            constraint: groupingAttribute.constraint,
            resourceId: collection.id,
            resourceIndex: 0,
            resourceType: AttributesResourceType.Collection,
          };
          const resultItems = this.dataObjectAggregator.convert({
            groupingAttributes: [groupingObjectAttribute],
            objectAttributes: [],
            metaAttributes: [],
            objectsConverter: value => value,
          });
          for (const item of resultItems) {
            const key = item.groupingObjects[0];
            const groupingDocuments = item.groupingDataResources as DocumentModel[];
            if (key) {
              if (!groupsMap[key]) {
                groupsMap[key] = {tasks: [], title: key};
              }
              groupsMap[key].tasks.push(...groupingDocuments);
              groupingDocuments.forEach(document => usedDocumentsIds.add(document.id));
            }
          }
        }
      });

      const otherDocuments = documents.filter(document => !usedDocumentsIds.has(document.id));

      if (otherDocuments.length) {
        const hasAnyGroup = defaultTitle || Object.keys(groupsMap).length > 0;
        return [
          ...objectValues(groupsMap),
          {tasks: otherDocuments, title: hasAnyGroup ? $localize`:@@other:Other` : null, titleClassList: 'fst-italic'},
        ];
      }
      return objectValues(groupsMap);
    }

    return [{tasks: documents, title: defaultTitle}];
  }

  private findGroupingAttribute(collection: Collection, groupBy: TasksConfigGroupBy): Attribute {
    let attributeId;
    switch (groupBy) {
      case TaskConfigAttribute.Assignee: {
        attributeId = collection.purpose?.metaData?.assigneeAttributeId;
        break;
      }
      case TaskConfigAttribute.State: {
        attributeId = collection.purpose?.metaData?.stateAttributeId;
        break;
      }
      case TaskConfigAttribute.Priority: {
        attributeId = collection.purpose?.metaData?.priorityAttributeId;
        break;
      }
      case TaskConfigAttribute.DueDate: {
        attributeId = collection.purpose?.metaData?.dueDateAttributeId;
        break;
      }
    }
    return findAttribute(collection.attributes, attributeId);
  }

  private splitPinnedDocuments(documents: DocumentModel[]): {pinned: DocumentModel[]; other: DocumentModel[]} {
    const pinned = [];
    const other = [];
    documents?.forEach(document => {
      if (document.favorite) {
        pinned.push(document);
      } else {
        other.push(document);
      }
    });
    return {pinned, other};
  }
}
