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
import {AllowedPermissions, ResourcesPermissions} from '../../../../../../core/model/allowed-permissions';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {queryAttributePermissions} from '../../../../../../core/model/query-attribute';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../../../core/model/resource';
import {AggregatedDataItem, DataAggregatorAttribute} from '../../../../../../shared/utils/data/data-aggregator';
import {uniqueValues} from '../../../../../../shared/utils/array.utils';
import {
  TABLE_BOTTOM_TOOLBAR_HEIGHT,
  TABLE_ROW_BORDER,
  TABLE_ROW_HEIGHT,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {TableRow, TableRowCellsMap} from '../../../../../../shared/table/model/table-row';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {AttributeSortType, ViewSettings} from '../../../../../../core/store/views/view';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {sortDataObjectsByViewSettings} from '../../../../../../shared/utils/data-resource.utils';
import {WorkflowTable} from '../../../model/workflow-table';
import {resourceAttributeSettings} from '../../../../../../shared/settings/settings.util';
import {isNotNullOrUndefined, objectValues} from '../../../../../../shared/utils/common.utils';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {ViewCursor} from '../../../../../../core/store/navigation/view-cursor/view-cursor';
import {computeAttributeLockStats, ConstraintData} from '@lumeer/data-filters';
import {isAttributeLockEnabledByLockStats} from '../../../../../../shared/utils/attribute.utils';

export const WORKFLOW_SIDEBAR_SELECTOR = 'workflow-sidebar';

export interface PendingRowUpdate {
  row: TableRow;
  value: any;
}

export function computeTableHeight(rows: TableRow[], newRow: TableRow, maxRows?: number): number {
  const trimmedRows = rows.slice(0, maxRows || rows.length);
  // header + border
  let additionalHeight = TABLE_ROW_HEIGHT + TABLE_ROW_BORDER;
  if (newRow?.height) {
    // + border
    additionalHeight += TABLE_BOTTOM_TOOLBAR_HEIGHT;
  }
  if (trimmedRows.length === 0) {
    additionalHeight += TABLE_ROW_HEIGHT;
  }

  return trimmedRows.reduce((height, row) => height + row.height, additionalHeight);
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
        const pendingRowUpdate = pendingColumnValues?.[column.id]?.find(pending => pending.row.id === row.id);
        const currentValue =
          pendingRowUpdate?.value || (overrideColumn?.id === column.id ? value : row.cellsMap[column.id].data);
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

export function createEmptyNewRow(tableId: string): TableRow {
  const id = generateId();
  return {
    id,
    tableId,
    cellsMap: {},
    correlationId: id,
    height: TABLE_ROW_HEIGHT,
    documentEditable: true,
    linkEditable: true,
    canSuggest: true,
    documentMenuItems: [],
    linkMenuItems: [],
  };
}

export function createLinkTypeData(
  stemConfig: WorkflowStemConfig,
  collections: Collection[],
  permissions: ResourcesPermissions,
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
      permissions
    );
    return {linkType, permissions: linkTypePermissions};
  }
  return {};
}

export function workflowTableId(stem: QueryStem, ...values: string[]): string {
  return [stem.collectionId, ...(stem.linkTypeIds || []), ...(values || [].filter(value => !!value))].join('');
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
  collection: Collection,
  linkType: LinkType,
  linkInstancesMap: Record<string, LinkInstance>,
  viewSettings: ViewSettings,
  constraintData: ConstraintData
): {document: DocumentModel; linkInstance?: LinkInstance}[] {
  const documents = <DocumentModel[]>item.dataResources || [];
  const objects = documents.reduce(
    (rowData, document, index) => {
      const chain = [...(parentItem.dataResourcesChains?.[index] || []), ...(item.dataResourcesChains?.[index] || [])];
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

  return sortDataObjectsByViewSettings(objects, collection, linkType, viewSettings?.attributes, constraintData, false);
}

export function createTableRowCellsMapForResource(
  object: DataResource,
  columns: TableColumn[],
  resource: AttributesResource,
  constraintData: ConstraintData,
  overrideData?: Record<string, any>
): TableRowCellsMap {
  return (columns || []).reduce<TableRowCellsMap>((cellsMap, column) => {
    const data = isNotNullOrUndefined(overrideData?.[column.id])
      ? overrideData[column.id]
      : object.data?.[column.attribute?.id];
    const lockStats = computeAttributeLockStats(object, resource, column.attribute?.lock, constraintData);
    const editable = isAttributeLockEnabledByLockStats(column.attribute?.lock, lockStats);
    cellsMap[column.id] = {data, lockStats, editable};
    return cellsMap;
  }, {});
}

export function createTableRowCellsMapForAttribute(
  attribute: Attribute,
  data: any,
  columns: TableColumn[]
): TableRowCellsMap {
  const column = columns.find(c => c.attribute.id === attribute.id);
  return (
    (column && {
      [column.id]: {
        data,
        lockStats: null,
        editable: false,
      },
    }) ||
    {}
  );
}

export function createPendingColumnValuesByRow(pendingValues: Record<string, PendingRowUpdate[]>): Record<string, any> {
  return Object.keys(pendingValues).reduce((result, columnId) => {
    const updates = pendingValues[columnId];
    for (const update of updates) {
      const row = update.row;
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

export function workflowCellToViewCursor(cell: TableCell, column: TableColumn): ViewCursor {
  if (cell?.type === TableCellType.Body) {
    return {
      documentId: cell.documentId,
      linkInstanceId: cell.linkId,
      collectionId: column?.collectionId,
      linkTypeId: column?.linkTypeId,
      attributeId: column?.attribute?.id,
      value: column?.tableId || cell?.tableId,
    };
  }

  return null;
}

export function viewCursorToWorkflowTable<T extends TableModel>(cursor: ViewCursor, tables: T[]): T {
  if (cursor?.value) {
    return tables.find(t => t.id === cursor.value);
  }
  if (cursor?.collectionId) {
    return tables.find(
      t => t.collectionId === cursor.collectionId && t.rows.some(r => r.documentId === cursor.documentId)
    );
  }

  return null;
}

export function viewCursorToWorkflowCell(cursor: ViewCursor, tables: TableModel[]): TableCell {
  const table = viewCursorToWorkflowTable(cursor, tables);
  if (table) {
    const row = cursor.documentId && table.rows.find(r => r.documentId === cursor.documentId);
    const column = cursor.attributeId && table.columns.find(c => c.attribute?.id === cursor.attributeId);
    if (row && column) {
      return {
        type: TableCellType.Body,
        documentId: cursor.documentId,
        linkId: cursor.linkInstanceId,
        rowId: row.id,
        tableId: table.id,
        columnId: column.id,
      };
    }
  }

  return null;
}
