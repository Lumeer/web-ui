/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {KanbanCollectionConfig, KanbanColumn, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {formatDataValue} from '../../../../shared/utils/data.utils';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';

const COLUMN_WIDTH = 300;

export function buildKanbanConfig(config: KanbanConfig, documents: DocumentModel[], collections: Collection[], constraintData?: ConstraintData): KanbanConfig {
  const currentColumns = config && config.columns || [];

  const documentsByCollection = groupDocumentsByCollection(documents);
  const {columnsMap, otherDocumentsIds} = groupDocumentsByColumns(documentsByCollection, config && config.collections || {}, collections, constraintData);

  const columns = createKanbanColumns(currentColumns, columnsMap);
  const otherColumn = {width: COLUMN_WIDTH, documentsIdsOrder: otherDocumentsIds};
  return {...config, columns, otherColumn};
}

function groupDocumentsByCollection(documents: DocumentModel[]): Record<string, DocumentModel[]> {
  return (documents || []).reduce((map, doc) => {
    if (!map[doc.collectionId]) {
      map[doc.collectionId] = [];
    }
    map[doc.collectionId].push(doc);
    return map;
  }, {});
}

function groupDocumentsByColumns(documentsByCollection: Record<string, DocumentModel[]>, collectionsConfig: Record<string, KanbanCollectionConfig>, collections: Collection[], constraintData?: ConstraintData): { columnsMap: Record<string, string[]>, otherDocumentsIds: string[] } {
  const columnsMap = {};
  const otherDocumentsIds = [];
  for (const collection of collections || []) {
    const collectionConfig = collectionsConfig[collection.id];
    const selectedAttributeId = collectionConfig && collectionConfig.attribute && collectionConfig.attribute.attributeId;
    const attribute = (collection.attributes || []).find(attribute => attribute.id === selectedAttributeId);
    const documents = documentsByCollection[collection.id] || [];
    if (attribute) {
      for (const document of documents) {
        const value = document.data[attribute.id];
        const formattedValue = formatDataValue(value, attribute.constraint, constraintData);
        if (isNotNullOrUndefined(formattedValue) && formattedValue !== '') {
          if (!columnsMap[formattedValue.toString()]) {
            columnsMap[formattedValue.toString()] = []
          }

          columnsMap[formattedValue].push(document.id);
        } else {
          otherDocumentsIds.push(document.id);
        }

      }

    } else {
      otherDocumentsIds.push(...documents.map(document => document.id))
    }

  }

  return {columnsMap, otherDocumentsIds};
}

function createKanbanColumns(currentColumns: KanbanColumn[], columnsMap: Record<string, string[]>): KanbanColumn[] {
  let newColumnsTitles = Object.keys(columnsMap);

  const newColumns = [];
  for (const currentColumn of currentColumns) {
    const title = currentColumn.title;
    const documentsIdsOrder = sortDocumentsIdsByPreviousOrder(columnsMap[title] || [], currentColumn.documentsIdsOrder);
    newColumns.push({title, width: currentColumn.width, documentsIdsOrder});

    newColumnsTitles = newColumnsTitles.filter(newColumnTitle => newColumnTitle !== title);
  }

  for (const title of newColumnsTitles) {
    newColumns.push({title, width: COLUMN_WIDTH, documentsIdsOrder: columnsMap[title]})
  }

  return newColumns;
}

function sortDocumentsIdsByPreviousOrder(documentsIds: string[], orderedDocumentsIds: string[]): string[] {
  const newOrderedDocumentsIds = [];
  const documentsIdsSet = new Set(documentsIds);

  for (const documentId of orderedDocumentsIds) {
    if (documentsIdsSet.has(documentId)) {
      newOrderedDocumentsIds.push(documentId);
      documentsIdsSet.delete(documentId);
    }
  }

  documentsIdsSet.forEach(documentId => newOrderedDocumentsIds.push(documentId));

  return newOrderedDocumentsIds;
}
