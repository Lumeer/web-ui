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

import {WorkflowStemConfig} from '../../../../../../core/store/workflows/workflow';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {queryAttributePermissions} from '../../../../../../core/model/query-attribute';
import {AttributesResourceType} from '../../../../../../core/model/resource';
import {AggregatedDataItem, DataAggregatorAttribute} from '../../../../../../shared/utils/data/data-aggregator';
import {uniqueValues} from '../../../../../../shared/utils/array.utils';
import {TABLE_ROW_HEIGHT} from '../../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {TableNewRow, TableRow} from '../../../../../../shared/table/model/table-row';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {AttributeSortType, ViewSettings} from '../../../../../../core/store/views/view';
import {ConstraintData} from '../../../../../../core/model/data/constraint';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {sortDataResourcesByViewSettings} from '../../../../../../shared/utils/data-resource.utils';
import {WorkflowTable} from '../../../model/workflow-table';
import {resourceAttributeSettings} from '../../../../../../shared/settings/settings.util';
import {objectValues} from '../../../../../../shared/utils/common.utils';

export interface PendingRowUpdate {
  row?: TableRow;
  newRow?: TableNewRow;
  value: any;
}

export function computeTableHeight(numberOfRows: number, newRow?: TableNewRow): number {
  // + 1 for borders
  return (numberOfRows + 1) * TABLE_ROW_HEIGHT + 1 + (newRow?.height ? newRow.height + 1 : 0);
}

export function createRowData(
  row: TableRow,
  columns: TableColumn[],
  pendingColumnValues: Record<string, PendingRowUpdate[]>,
  overrideColumn?: TableColumn,
  value?: any
): {data: Record<string, any>; linkData: Record<string, any>} {
  return columns.reduce(
    (result, column) => {
      if (column.attribute) {
        const pendingRowUpdate = pendingColumnValues?.[column.id]?.find(
          pending => (pending.row || pending.newRow).id === row.id
        );
        const currentValue =
          pendingRowUpdate?.value || (overrideColumn?.id === column.id ? value : row.data[column.id]);
        if (column.collectionId) {
          result.data[column.attribute.id] = currentValue;
        } else if (column.linkTypeId) {
          result.linkData[column.attribute.id] = currentValue;
        }
      }
      return result;
    },
    {data: {}, linkData: {}}
  );
}

export function createEmptyNewRow(tableId: string): TableNewRow {
  const id = generateId();
  return {
    id,
    tableId,
    data: null,
    correlationId: id,
    height: TABLE_ROW_HEIGHT,
    documentMenuItems: [],
    linkMenuItems: [],
  };
}

export function createLinkTypeData(
  stemConfig: WorkflowStemConfig,
  collections: Collection[],
  permissions: Record<string, AllowedPermissions>,
  linkTypesMap: Record<string, LinkType>
): {linkType?: LinkType; permissions?: AllowedPermissions} {
  if (isLinkedOrGroupedConfig(stemConfig)) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      stemConfig.stem,
      collections,
      objectValues(linkTypesMap)
    );
    const resourceIndex = stemConfig.collection.resourceIndex;
    const linkIndex = resourceIndex + (resourceIndex < stemConfig.attribute?.resourceIndex ? 1 : -1);
    const linkType = <LinkType>attributesResourcesOrder[linkIndex];
    const linkTypePermissions = queryAttributePermissions(
      {
        resourceId: linkType.id,
        resourceType: AttributesResourceType.LinkType,
      },
      permissions,
      linkTypesMap
    );
    return {linkType, permissions: linkTypePermissions};
  }
  return {};
}

export function isLinkedOrGroupedConfig(stemConfig: WorkflowStemConfig): boolean {
  return isGroupedConfig(stemConfig) || isLinkedConfig(stemConfig);
}

function isGroupedConfig(stemConfig: WorkflowStemConfig): boolean {
  return stemConfig?.attribute && stemConfig.collection.resourceIndex !== stemConfig.attribute.resourceIndex;
}

function isLinkedConfig(stemConfig: WorkflowStemConfig): boolean {
  return stemConfig.collection?.resourceIndex > 0;
}

export function createAggregatorAttributes(
  stemConfig: WorkflowStemConfig,
  attribute: Attribute
): DataAggregatorAttribute[] {
  const aggregatorAttributes = [];
  if (attribute) {
    const rowAttribute: DataAggregatorAttribute = {
      resourceIndex: stemConfig.attribute.resourceIndex,
      attributeId: attribute.id,
      data: stemConfig.attribute.constraint,
    };
    aggregatorAttributes.push(rowAttribute);
  }

  if (isLinkedConfig(stemConfig) && !isGroupedConfig(stemConfig)) {
    // is linked collection
    const rowAttribute: DataAggregatorAttribute = {
      resourceIndex: stemConfig.collection.resourceIndex - 1,
      attributeId: null,
    };

    aggregatorAttributes.push(rowAttribute);
  }

  const valueAttribute: DataAggregatorAttribute = {
    resourceIndex: stemConfig.collection.resourceIndex,
    attributeId: null,
  };
  aggregatorAttributes.push(valueAttribute);

  if (aggregatorAttributes.length === 1) {
    aggregatorAttributes.push(valueAttribute);
  }

  return aggregatorAttributes;
}

export function createLinkingCollectionId(
  stemConfig: WorkflowStemConfig,
  collections: Collection[],
  linkTypesMap: Record<string, LinkType>
): string | null {
  if (isLinkedOrGroupedConfig(stemConfig)) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(
      stemConfig.stem,
      collections,
      objectValues(linkTypesMap)
    );
    const resourceIndex = stemConfig.collection.resourceIndex;
    const collectionIndex = resourceIndex + (resourceIndex < stemConfig.attribute?.resourceIndex ? 2 : -2);
    return attributesResourcesOrder[collectionIndex]?.id;
  }
  return null;
}

export function createAggregatedLinkingDocumentsIds(item: AggregatedDataItem, childItem: AggregatedDataItem): string[] {
  const linkingDocumentIds = [];
  for (const parentChain of item.dataResourcesChains) {
    for (const childChain of childItem.dataResourcesChains) {
      const chain = [...parentChain, ...childChain];
      if (chain.length > 2) {
        // sequence of documentId, linkId, documentId
        chain.reverse();
        // skip first documentId which is showed in table
        const documentId = chain.slice(1).find(ch => ch.documentId)?.documentId;
        if (documentId) {
          linkingDocumentIds.push(documentId);
        }
      }
    }
  }
  return uniqueValues(linkingDocumentIds);
}

export function createRowObjectsFromAggregated(
  parentItem: AggregatedDataItem,
  item: AggregatedDataItem,
  collectionsMap: Record<string, Collection>,
  linkInstancesMap: Record<string, LinkInstance>,
  viewSettings: ViewSettings,
  constraintData: ConstraintData
): {document: DocumentModel; linkInstance?: LinkInstance}[] {
  const documents = <DocumentModel[]>item.dataResources || [];
  const sortedDocuments = sortDataResourcesByViewSettings<DocumentModel>(
    documents,
    collectionsMap,
    AttributesResourceType.Collection,
    viewSettings,
    constraintData
  );
  return sortedDocuments.reduce(
    (rowData, document) => {
      const chainIndex = documents.findIndex(doc => doc === document);
      const chain = [
        ...(parentItem.dataResourcesChains?.[chainIndex] || []),
        ...(item.dataResourcesChains?.[chainIndex] || []),
      ];
      let linkInstance: LinkInstance;
      if (chain?.length > 1) {
        // documentIds and linkInstanceIds are in sequence
        chain.reverse();
        // skip first documentId
        const linkInstanceId = chain.splice(1).find(ch => ch.linkInstanceId)?.linkInstanceId;
        linkInstance = linkInstanceId && linkInstancesMap[linkInstanceId];
      }

      const id = `${document.id}${linkInstance?.id || ''}`;
      if (!rowData.ids.has(id)) {
        rowData.data.push({document, linkInstance});
        rowData.ids.add(id);
      }

      return rowData;
    },
    {data: [], ids: new Set()}
  ).data;
}

export function createRowValues(data: Record<string, any>, columnIdsMap: Record<string, string>): Record<string, any> {
  return Object.keys(data || {}).reduce((rowData, attributeId) => {
    if (columnIdsMap[attributeId]) {
      rowData[columnIdsMap[attributeId]] = data[attributeId];
    }
    return rowData;
  }, {});
}

export function createColumnIdsMap(columns: TableColumn[]): Record<string, string> {
  return columns.reduce((idsMap, column) => {
    if (column.attribute) {
      idsMap[column.attribute.id] = column.id;
    }
    return idsMap;
  }, {});
}

export function createPendingColumnValuesByRow(pendingValues: Record<string, PendingRowUpdate[]>): Record<string, any> {
  return Object.keys(pendingValues).reduce((result, columnId) => {
    const updates = pendingValues[columnId];
    for (const update of updates) {
      const row = update.row || update.newRow;
      if (!result[row.id]) {
        result[row.id] = {};
      }
      result[row.id][columnId] = update.value;
    }
    return result;
  }, {});
}

export function isWorkflowStemConfigGroupedByResourceType(
  stemConfig: WorkflowStemConfig,
  type: AttributesResourceType
): boolean {
  if (stemConfig.attribute?.resourceType === type) {
    return type === AttributesResourceType.Collection
      ? stemConfig.attribute.resourceIndex === stemConfig.collection.resourceIndex
      : Math.abs(stemConfig.attribute.resourceIndex - stemConfig.collection.resourceIndex) === 1;
  }
  return false;
}

export function sortWorkflowTables(
  tables: WorkflowTable[],
  config: WorkflowStemConfig,
  settings: ViewSettings
): WorkflowTable[] {
  if (config.attribute) {
    const attributeSettings = resourceAttributeSettings(
      settings,
      config.attribute.attributeId,
      config.attribute.resourceId,
      config.attribute.resourceType
    );
    if (attributeSettings?.sort) {
      const ascending = attributeSettings.sort === AttributeSortType.Ascending;
      return tables.sort((a, b) => a.title?.dataValue?.compareTo(b.title?.dataValue) * (ascending ? 1 : -1));
    }
  }

  return tables;
}
