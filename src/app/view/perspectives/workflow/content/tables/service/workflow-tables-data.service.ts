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

import {AppState} from '../../../../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {Injectable} from '@angular/core';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../../core/store/link-instances/link-instances.action';
import {map, take} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {AttributeSortType, ResourceAttributeSettings, ViewSettings} from '../../../../../../core/store/views/view';
import {
  TABLE_COLUMN_WIDTH,
  TABLE_ROW_HEIGHT,
  TableCellType,
  TableModel,
  TableNewRow,
} from '../../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../../../shared/settings/settings.util';
import {WorkflowTablesMenuService} from './workflow-tables-menu.service';
import {generateAttributeName} from '../../../../../../shared/utils/attribute.utils';
import {WorkflowTablesStateService} from './workflow-tables-state.service';
import {ViewSettingsAction} from '../../../../../../core/store/view-settings/view-settings.action';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {viewSettingsChanged} from '../../../../../../core/store/views/view.utils';
import {
  WorkflowColumnSettings,
  WorkflowConfig,
  WorkflowStemConfig,
} from '../../../../../../core/store/workflows/workflow';
import {SelectItemWithConstraintFormatter} from '../../../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {
  AggregatedArrayData,
  AggregatedDataItem,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../../../shared/utils/data/data-aggregator';
import {Constraint} from '../../../../../../core/model/constraint';
import {ConstraintData} from '../../../../../../core/model/data/constraint';
import {UnknownConstraint} from '../../../../../../core/model/constraint/unknown.constraint';
import {
  findAttributeByQueryAttribute,
  QueryAttribute,
  queryAttributePermissions,
} from '../../../../../../core/model/query-attribute';
import {WorkflowTable} from '../../../model/workflow-table';
import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {queryStemsAreSame} from '../../../../../../core/store/navigation/query/query.util';
import {objectsByIdMap} from '../../../../../../shared/utils/common.utils';
import {groupTableColumns, numberOfDiffColumnsBefore} from '../../../../../../shared/table/model/table-utils';
import {selectWorkflowId} from '../../../../../../core/store/workflows/workflow.state';
import {WorkflowsAction} from '../../../../../../core/store/workflows/workflows.action';
import {sortDataResourcesByViewSettings} from '../../../../../../shared/utils/data-resource.utils';
import {generateDocumentDataByResourceQuery} from '../../../../../../core/store/documents/document.utils';
import {
  createAggregatedLinkingDocumentsIds,
  createEmptyNewRow,
  createLinkingCollectionId,
  createLinkTypeData,
} from './workflow-utils';
import {selectDocumentsByCollectionId} from '../../../../../../core/store/documents/documents.state';
import {selectDocumentsByCustomQuery} from '../../../../../../core/store/common/permissions.selectors';

interface PendingRowUpdate {
  row: TableRow;
  value: any;
}

@Injectable()
export class WorkflowTablesDataService {
  private pendingColumnValues: Record<string, PendingRowUpdate[]> = {};
  private pendingCorrelationIds: string[] = [];
  private dataAggregator: DataAggregator;

  constructor(
    private store$: Store<AppState>,
    private menuService: WorkflowTablesMenuService,
    private stateService: WorkflowTablesStateService,
    private modalService: ModalService,
    private i18n: I18n,
    private constraintItemsFormatter: SelectItemWithConstraintFormatter
  ) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatWorkflowValue(value, constraint, data, aggregatorAttribute)
    );
  }

  private formatWorkflowValue(
    value: any,
    constraint: Constraint,
    constraintData: ConstraintData,
    aggregatorAttribute: DataAggregatorAttribute
  ): any {
    const kanbanConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const overrideConstraint =
      kanbanConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, kanbanConstraint);
    const finalConstraint = overrideConstraint || constraint || new UnknownConstraint();
    return finalConstraint.createDataValue(value, constraintData).serialize();
  }

  public checkSettingsChange(viewSettings: ViewSettings) {
    if (
      viewSettingsChanged(
        this.stateService.viewSettings,
        viewSettings,
        this.stateService.collectionsMap,
        this.stateService.linkTypesMap
      )
    ) {
      this.createAndSyncTables(
        this.stateService.collections,
        this.stateService.documents,
        this.stateService.linkTypes,
        this.stateService.linkInstances,
        this.stateService.config,
        this.stateService.permissions,
        this.stateService.query,
        viewSettings,
        this.stateService.constraintData
      );
    }
  }

  public createAndSyncTables(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    config: WorkflowConfig,
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    viewSettings: ViewSettings,
    constraintData: ConstraintData
  ) {
    const currentTables = this.stateService.tables;
    this.stateService.updateData(
      collections,
      documents,
      linkTypes,
      linkInstances,
      config,
      permissions,
      query,
      viewSettings,
      constraintData
    );

    const {tables, actions} = this.createTablesAndSyncActions(
      currentTables,
      collections,
      documents,
      linkTypes,
      linkInstances,
      config,
      permissions,
      query,
      viewSettings,
      constraintData
    );
    actions.forEach(action => this.store$.dispatch(action));
    this.stateService.setTables(tables);
  }

  public createTablesAndSyncActions(
    currentTables: TableModel[],
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    config: WorkflowConfig,
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    viewSettings: ViewSettings,
    constraintData: ConstraintData
  ): {tables: WorkflowTable[]; actions: Action[]} {
    const collectionsMap = objectsByIdMap(collections);
    const linkTypesMap = objectsByIdMap(linkTypes);
    const linkInstancesMap = objectsByIdMap(linkInstances);
    return config.stemsConfigs.reduce(
      (result, stemConfig) => {
        const collection = collectionsMap[stemConfig.collection?.resourceId];
        if (!collection) {
          return result;
        }

        // creating collection columns
        const tableByCollection = currentTables.find(tab => tab.collectionId === collection.id);
        const currentCollectionColumns = (tableByCollection?.columns || []).filter(column => column.collectionId);
        const {linkType, permissions: linkPermissions} = createLinkTypeData(
          stemConfig,
          collections,
          permissions,
          linkTypesMap
        );
        const {
          columns: collectionColumns,
          actions: collectionActions,
          permissions: collectionPermissions,
        } = this.createCollectionColumns(
          config,
          stemConfig,
          currentCollectionColumns,
          collection,
          permissions,
          linkTypesMap,
          viewSettings,
          query,
          linkPermissions
        );

        // creating link columns
        const currentLinkColumns = (tableByCollection?.columns || []).filter(column => column.linkTypeId);
        const {columns: linkColumns, actions: linkActions} = this.createLinkTypeColumns(
          config,
          currentLinkColumns,
          linkType,
          linkPermissions,
          viewSettings,
          query
        );

        // aggregate documents and links to create rows
        const attribute = findAttributeByQueryAttribute(stemConfig.attribute, collections, linkTypes);
        this.dataAggregator.updateData(
          collections,
          documents,
          linkTypes,
          linkInstances,
          stemConfig.stem,
          constraintData
        );
        const aggregatedData = this.aggregateData(stemConfig, attribute);
        const constraint = this.checkOverrideConstraint(attribute, stemConfig.attribute);

        const columns = [...linkColumns, ...collectionColumns];
        const columnsWidth = groupTableColumns(columns).reduce((width, group) => (width += group.width), 0);
        const stemTableSettings = config.tables?.filter(
          tab => queryStemsAreSame(tab.stem, stemConfig.stem) && tab.collectionId === collection.id
        );
        const linkColumnIdsMap = createColumnIdsMap(linkColumns);
        const isGroupedByCollection = this.isGroupedByResourceType(stemConfig, AttributesResourceType.Collection);
        const isGroupedByLink = this.isGroupedByResourceType(stemConfig, AttributesResourceType.LinkType);
        const columnIdsMap = createColumnIdsMap(collectionColumns);
        const linkingCollectionId = createLinkingCollectionId(stemConfig, collections, linkTypesMap, documents);
        for (const aggregatedDataItem of aggregatedData.items) {
          const title = aggregatedDataItem.value || '';
          const tableId = collection.id + title;
          const titleDataValue = constraint.createDataValue(title, constraintData);
          const titleDataResources = aggregatedDataItem.dataResources;
          for (const childItem of aggregatedDataItem.children || []) {
            const currentTable = currentTables.find(table => table.id === tableId) || tableByCollection;
            const {rows, newRow} = this.createRows(
              tableId,
              currentTable?.rows || [],
              currentTable?.newRow,
              createRowDataFromAggregated(
                aggregatedDataItem,
                childItem,
                collectionsMap,
                linkInstancesMap,
                viewSettings,
                constraintData
              ),
              linkColumnIdsMap,
              columnIdsMap,
              linkPermissions,
              collectionPermissions
            );

            const collectionInitialData = isGroupedByCollection ? {[attribute.id]: title} : {};
            const linkInitialData = isGroupedByLink ? {[attribute.id]: title} : {};
            const newRowData = this.createNewRowData(
              collectionInitialData,
              linkInitialData,
              collection,
              linkType,
              columnIdsMap,
              linkColumnIdsMap
            );

            const tableSettings = stemTableSettings?.find(tab => tab.value === title);

            // + 1 for borders
            const heightFn = (numberOfRows: number) =>
              (numberOfRows + 1) * TABLE_ROW_HEIGHT + 1 + (newRow?.height ? newRow.height + 1 : 0);
            const workflowTable: WorkflowTable = {
              id: tableId,
              columns: columns.map(column => ({...column, tableId})),
              rows,
              collectionId: collection.id,
              linkTypeId: linkType?.id,
              title: attribute && {
                value: title,
                dataValue: titleDataValue,
                constraint,
                dataResources: titleDataResources,
              },
              stem: stemConfig.stem,
              maxHeight: heightFn(rows.length),
              minHeight: heightFn(Math.min(rows.length, 1)),
              height: tableSettings?.height || heightFn(Math.min(rows.length, 5)),
              width: columnsWidth + 1, // + 1 for border
              newRow: newRow ? {...newRow, data: newRow.data || newRowData} : undefined,
              newRowData,
              linkingDocumentIds:
                !linkingCollectionId && createAggregatedLinkingDocumentsIds(aggregatedDataItem, childItem),
              linkingCollectionId,
            };
            result.tables.push(workflowTable);
          }
        }

        result.actions.push(...linkActions);
        result.actions.push(...collectionActions);
        return result;
      },
      {tables: [], actions: []}
    );
  }

  private isGroupedByResourceType(stemConfig: WorkflowStemConfig, type: AttributesResourceType): boolean {
    if (stemConfig.attribute?.resourceType === type) {
      return type === AttributesResourceType.Collection
        ? stemConfig.attribute.resourceIndex === stemConfig.collection.resourceIndex
        : Math.abs(stemConfig.attribute.resourceIndex - stemConfig.collection.resourceIndex) === 1;
    }
    return false;
  }

  private createNewRowData(
    initialCollectionData: Record<string, any>,
    initialLinkData: Record<string, any>,
    collection: Collection,
    linkType: LinkType,
    collectionColumnsMap: Record<string, string>,
    linkColumnsMap: Record<string, string>
  ): Record<string, any> {
    const query = this.stateService.query;
    const constraintData = this.stateService.constraintData;
    const documentData = generateDocumentDataByResourceQuery(collection, query, constraintData);
    const linkData = linkType ? generateDocumentDataByResourceQuery(linkType, query, constraintData) : {};

    return {
      ...createRowData(documentData, collectionColumnsMap),
      ...createRowData(linkData, linkColumnsMap),
      ...createRowData(initialCollectionData, collectionColumnsMap),
      ...createRowData(initialLinkData, linkColumnsMap),
    };
  }

  private aggregateData(stemConfig: WorkflowStemConfig, attribute: Attribute): AggregatedArrayData {
    const aggregatorAttributes = [];
    if (attribute) {
      const rowAttribute: DataAggregatorAttribute = {
        resourceIndex: stemConfig.attribute.resourceIndex,
        attributeId: attribute.id,
        data: stemConfig.attribute.constraint,
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

    return this.dataAggregator.aggregateArray(aggregatorAttributes, []);
  }

  private checkOverrideConstraint(attribute: Attribute, workflowAttribute: QueryAttribute): Constraint {
    const kanbanConstraint = workflowAttribute?.constraint;
    const overrideConstraint =
      kanbanConstraint &&
      this.constraintItemsFormatter.checkValidConstraintOverride(attribute?.constraint, kanbanConstraint);
    return overrideConstraint || attribute?.constraint || new UnknownConstraint();
  }

  private createCollectionColumns(
    config: WorkflowConfig,
    stemConfig: WorkflowStemConfig,
    currentColumns: TableColumn[],
    collection: Collection,
    permissions: Record<string, AllowedPermissions>,
    linkTypesMap: Record<string, LinkType>,
    viewSettings: ViewSettings,
    query: Query,
    linkTypePermissions: AllowedPermissions
  ): {columns: TableColumn[]; actions: Action[]; permissions: AllowedPermissions} {
    const collectionPermissions = queryAttributePermissions(stemConfig.collection, permissions, linkTypesMap);
    const collectionSettings = viewSettings?.attributes?.collections?.[collection.id] || [];

    return {
      ...this.createColumns(
        currentColumns,
        collection,
        AttributesResourceType.Collection,
        collectionPermissions,
        query,
        collectionSettings,
        config.columns?.collections?.[collection.id] || [],
        linkTypePermissions
      ),
      permissions: collectionPermissions,
    };
  }

  private createLinkTypeColumns(
    config: WorkflowConfig,
    currentColumns: TableColumn[],
    linkType: LinkType,
    permissions: AllowedPermissions,
    viewSettings: ViewSettings,
    query: Query
  ): {columns: TableColumn[]; actions: Action[]} {
    if (linkType) {
      const linkTypeSettings = viewSettings?.attributes?.linkTypes?.[linkType.id] || [];

      return {
        ...this.createColumns(
          currentColumns,
          linkType,
          AttributesResourceType.LinkType,
          permissions,
          query,
          linkTypeSettings,
          config.columns?.linkTypes?.[linkType.id] || []
        ),
      };
    }

    return {columns: [], actions: []};
  }

  private createColumns(
    currentColumns: TableColumn[],
    resource: AttributesResource,
    resourceType: AttributesResourceType,
    permissions: AllowedPermissions,
    query: Query,
    settings: ResourceAttributeSettings[],
    columnsSettings: WorkflowColumnSettings[],
    otherPermissions?: AllowedPermissions
  ): {columns: TableColumn[]; actions: Action[]} {
    const isCollection = resourceType === AttributesResourceType.Collection;
    const defaultAttributeId = isCollection ? getDefaultAttributeId(resource) : null;
    const columnSettingsMap = columnsSettings.reduce(
      (settingsMap, setting) => ({
        ...settingsMap,
        [setting.attributeId]: setting,
      }),
      {}
    );
    const mappedUncreatedColumns: Record<string, TableColumn> = {};

    const color = isCollection ? (<Collection>resource).color : null;
    const attributeColumns = createAttributesSettingsOrder(resource.attributes, settings).reduce<TableColumn[]>(
      (columns, setting) => {
        const attribute = findAttribute(resource.attributes, setting.attributeId);
        const editable = isCollection
          ? isCollectionAttributeEditable(attribute.id, resource, permissions, query)
          : isLinkTypeAttributeEditable(attribute.id, <LinkType>resource, permissions, query);
        const columnResourceId = (col: TableColumn) => (isCollection ? col.collectionId : col.linkTypeId);
        const columnByAttribute = currentColumns.find(
          col => columnResourceId(col) === resource.id && col.attribute?.id === attribute.id
        );
        let columnByName;
        if (!columnByAttribute) {
          // this is our created attribute and we know that attribute name is unique
          columnByName = currentColumns.find(
            col => columnResourceId(col) === resource.id && !col.attribute && col.name === attribute.name
          );
        }
        const currentColumn = columnByAttribute || columnByName;
        const columnSettings = columnSettingsMap[attribute.id];
        const column: TableColumn = {
          id: currentColumn?.id || generateId(),
          attribute,
          editable,
          width: columnSettings?.width || TABLE_COLUMN_WIDTH,
          collectionId: isCollection ? resource.id : null,
          linkTypeId: isCollection ? null : resource.id,
          color,
          default: attribute.id === defaultAttributeId,
          hidden: setting.hidden,
          manageable: permissions?.manageWithView,
          sort: setting.sort,
          menuItems: [],
        };
        column.menuItems.push(...this.menuService.createHeaderMenu(permissions, column, true, otherPermissions));
        if (columnByName) {
          mappedUncreatedColumns[column.id] = column;
          return columns;
        }

        columns.push(column);
        return columns;
      },
      []
    );

    const syncActions = [];
    const columnNames = (resource.attributes || []).map(attribute => attribute.name);
    for (let i = 0; i < currentColumns?.length; i++) {
      const column = {...currentColumns[i], color};
      if (!column.attribute) {
        attributeColumns.splice(i, 0, mappedUncreatedColumns[column.id] || column);
        if (mappedUncreatedColumns[column.id]) {
          this.stateService.addColumn(mappedUncreatedColumns[column.id], i);
          syncActions.push(
            new ViewSettingsAction.AddAttribute({
              attributeId: mappedUncreatedColumns[column.id].attribute.id,
              position: i,
              collection: isCollection && resource,
              linkType: !isCollection && <LinkType>resource,
            })
          );
        }
      }
      columnNames.push(column.name || column.attribute?.name);
    }

    if (isCollection && permissions.manageWithView && !attributeColumns.some(column => !column.attribute)) {
      const lastColumn: TableColumn = {
        id: generateId(),
        name: generateAttributeName(columnNames),
        collectionId: isCollection ? resource.id : null,
        linkTypeId: isCollection ? null : resource.id,
        editable: true,
        manageable: true,
        width: TABLE_COLUMN_WIDTH,
        color,
        menuItems: [],
      };
      lastColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, lastColumn, true));
      attributeColumns.push(lastColumn);
    }

    return {columns: attributeColumns, actions: syncActions};
  }

  public createEmptyLinkColumn(table: WorkflowTable): TableColumn {
    const config =
      table && this.stateService.config.stemsConfigs.find(stemConfig => queryStemsAreSame(stemConfig.stem, table.stem));
    const {linkType, permissions} = createLinkTypeData(
      config,
      this.stateService.collections,
      this.stateService.permissions,
      this.stateService.linkTypesMap
    );
    const columnNames = table.columns
      .filter(column => column.linkTypeId)
      .map(column => column.attribute?.name || column.name);
    if (linkType && permissions) {
      const lastColumn: TableColumn = {
        id: generateId(),
        name: generateAttributeName(columnNames),
        linkTypeId: linkType.id,
        editable: true,
        manageable: true,
        width: TABLE_COLUMN_WIDTH,
        color: null,
        menuItems: [],
      };
      lastColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, lastColumn, true));
      return lastColumn;
    }
    return null;
  }

  private createRows(
    tableId: string,
    currentRows: TableRow[],
    currentNewRow: TableRow,
    data: {document: DocumentModel; linkInstance?: LinkInstance}[],
    linkColumnIdsMap: Record<string, string>,
    columnIdsMap: Record<string, string>,
    linkPermissions: AllowedPermissions,
    collectionPermissions: AllowedPermissions
  ): {rows: TableRow[]; newRow: TableNewRow} {
    const rowsMap = currentRows.reduce(
      (result, row) => ({
        ...result,
        [row.linkInstanceId || row.documentId || row.correlationId]: row,
      }),
      {}
    );

    if (currentNewRow) {
      rowsMap[currentNewRow.correlationId] = currentNewRow;
    }

    const pendingColumnValuesByRow = createPendingColumnValuesByRow(this.pendingColumnValues);

    const rows = data.map(object => {
      const objectId = object.linkInstance?.id || object.document.id;
      const objectCorrelationId = object.linkInstance?.correlationId || object.document.correlationId;
      const currentRow = rowsMap[objectCorrelationId || objectId] || rowsMap[objectId];
      const documentData = createRowData(object.document.data, columnIdsMap);
      const linkData = createRowData(object.linkInstance?.data, linkColumnIdsMap);
      const isNewlyCreatedRow = this.pendingCorrelationIds.includes(objectCorrelationId);
      const pendingData = isNewlyCreatedRow
        ? pendingColumnValuesByRow[objectCorrelationId]
        : (currentRow && pendingColumnValuesByRow[currentRow.id]) || {};
      const id = isNewlyCreatedRow ? objectCorrelationId : currentRow?.id || object.document.id;
      const row: TableRow = {
        id,
        tableId,
        data: {...documentData, ...linkData, ...pendingData},
        documentId: object.document.id,
        linkInstanceId: object.linkInstance?.id,
        height: currentRow?.height || TABLE_ROW_HEIGHT,
        correlationId: objectCorrelationId || id,
        documentMenuItems: [],
        linkMenuItems: [],
      };
      row.documentMenuItems.push(...this.menuService.createRowMenu(collectionPermissions, row, !!object.linkInstance));
      row.linkMenuItems.push(...this.menuService.createRowMenu(linkPermissions, row, !!object.linkInstance));
      return row;
    });

    let newRow: TableNewRow;
    const canCreateNewRow = linkPermissions ? linkPermissions.writeWithView : collectionPermissions.writeWithView;
    if (canCreateNewRow) {
      const newRowSynced = currentNewRow && rows.find(row => row.correlationId === currentNewRow.correlationId);
      if (newRowSynced) {
        newRow = createEmptyNewRow(tableId);
      } else if (currentNewRow) {
        newRow = {...currentNewRow, documentMenuItems: [], linkMenuItems: [], data: null};
      } else {
        newRow = createEmptyNewRow(tableId);
      }
      newRow.documentMenuItems.push(...this.menuService.createRowMenu(collectionPermissions, newRow));
      newRow.linkMenuItems.push(...this.menuService.createRowMenu(linkPermissions, newRow));
    }

    return {rows, newRow};
  }

  public moveColumns(table: TableModel, from: number, to: number) {
    const columns = this.stateService.columns(table.id);
    const fromWithoutDifferent = from - numberOfDiffColumnsBefore(from, columns);
    const toWithoutDifferent = to - numberOfDiffColumnsBefore(to, columns);
    const column = columns[from];

    // prevent from detect change for settings
    this.stateService.syncColumnSettingsBeforeMove(table, fromWithoutDifferent, toWithoutDifferent);
    this.stateService.moveColumns(table, from, to);

    if (column?.attribute && fromWithoutDifferent !== toWithoutDifferent && toWithoutDifferent >= 0) {
      const {collection, linkType} = this.stateService.findColumnResourcesByColumn(column);
      this.store$.dispatch(
        new ViewSettingsAction.MoveAttribute({
          from: fromWithoutDifferent,
          to: toWithoutDifferent,
          collection,
          linkType,
        })
      );
    }
  }

  public resizeTable(table: WorkflowTable, height: number) {
    this.setWorkflowConfig(workflowId =>
      this.store$.dispatch(
        new WorkflowsAction.SetTableHeight({
          workflowId,
          collectionId: table.collectionId,
          stem: table.stem,
          value: table.title?.value || '',
          height,
        })
      )
    );
  }

  public changeSort(column: TableColumn, sort: AttributeSortType) {
    const {collection, linkType} = this.stateService.findColumnResourcesByColumn(column);
    this.store$.dispatch(
      new ViewSettingsAction.SetAttribute({
        attributeId: column.attribute.id,
        settings: {sort},
        collection,
        linkType,
      })
    );
  }

  public hideColumn(column: TableColumn) {
    const {collection, linkType} = this.stateService.findColumnResourcesByColumn(column);
    this.store$.dispatch(
      new ViewSettingsAction.HideAttributes({
        collectionAttributeIds: collection ? [column.attribute.id] : [],
        linkTypeAttributeIds: linkType ? [column.attribute.id] : [],
        collection,
        linkType,
      })
    );
  }

  public showColumns(columns: TableColumn[]) {
    const {collection, linkType} = this.stateService.findColumnResourcesByColumns(columns);
    this.store$.dispatch(
      new ViewSettingsAction.ShowAttributes({
        collectionAttributeIds: columns.filter(column => column.collectionId).map(column => column.attribute.id),
        linkTypeAttributeIds: columns.filter(column => column.linkTypeId).map(column => column.attribute.id),
        collection,
        linkType,
      })
    );
  }

  public createAttribute(column: TableColumn, name: string) {
    if (this.isColumnCreating(column)) {
      return;
    }

    this.stateService.startColumnCreating(column, name);

    const attribute: Attribute = {name, correlationId: column.id};
    if (column.collectionId) {
      this.store$.dispatch(
        new CollectionsAction.CreateAttributes({
          collectionId: column.collectionId,
          attributes: [attribute],
          onSuccess: attributes => this.onAttributeCreated(attributes[0], column),
          onFailure: () => this.stateService.endColumnCreating(column),
        })
      );
    } else if (column.linkTypeId) {
      this.store$.dispatch(
        new LinkTypesAction.CreateAttributes({
          linkTypeId: column.linkTypeId,
          attributes: [attribute],
          onSuccess: attributes => this.onAttributeCreated(attributes[0], column),
          onFailure: () => this.stateService.endColumnCreating(column),
        })
      );
    }
  }

  public isColumnCreating(column: TableColumn): boolean {
    return column.creating;
  }

  public isRowCreating(row: TableNewRow): boolean {
    return row?.creating;
  }

  public resizeColumn(changedTable: TableModel, column: TableColumn, width: number) {
    if (column.attribute) {
      this.setWorkflowConfig(workflowId =>
        this.store$.dispatch(
          new WorkflowsAction.SetColumnWidth({
            workflowId,
            width,
            attributeId: column.attribute.id,
            collectionId: column.collectionId,
            linkTypeId: column.linkTypeId,
          })
        )
      );
    } else {
      this.stateService.resizeColumn(changedTable, column, width);
    }
  }

  private setWorkflowConfig(callback: (workflowId: string) => void) {
    this.store$.pipe(select(selectWorkflowId), take(1)).subscribe(workflowId => callback(workflowId));
  }

  private onAttributeCreated(attribute: Attribute, column: TableColumn) {
    const newColumn = {...column, attribute};
    const deleteRows = [];
    for (const update of this.pendingColumnValues[column.id] || []) {
      const freshRow = this.stateService?.findTableRow(update.row.tableId, update.row.id);
      if (freshRow?.documentId) {
        this.patchColumnData(freshRow, newColumn, update.value);
        deleteRows.push(freshRow.id);
      } else if (freshRow) {
        this.createDocument(freshRow, newColumn, update.value);
      }
    }

    if (this.pendingColumnValues?.[column.id]) {
      this.pendingColumnValues[column.id] = this.pendingColumnValues[column.id].filter(
        update => !deleteRows.includes(update.row.id)
      );
      if (this.pendingColumnValues[column.id].length === 0) {
        delete this.pendingColumnValues[column.id];
      }
    }
  }

  public unlinkRow(row: TableRow, column: TableColumn) {
    if (row.documentId && row.linkInstanceId) {
      this.store$.dispatch(new LinkInstancesAction.DeleteConfirm({linkInstanceId: row.linkInstanceId}));
    } else {
      this.stateService.removeRow(row);
    }
  }

  public removeRow(row: TableRow, column: TableColumn) {
    if (row.documentId) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: column.collectionId,
          documentId: row.documentId,
        })
      );
    } else {
      this.stateService.removeRow(row);
    }
  }

  public showRowDocumentDetail(row: TableRow) {
    this.store$.dispatch(new WorkflowsAction.SetOpenedDocument({documentId: row.documentId}));
  }

  public showRowDetail(row: TableRow, column: TableColumn) {
    if (row.documentId) {
      this.showRowDocumentDetail(row);
    }
  }

  public showAttributeType(column: TableColumn) {
    this.modalService.showAttributeType(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public showAttributeFunction(column: TableColumn) {
    this.modalService.showAttributeFunction(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public renameAttribute(column: TableColumn, name: string) {
    if (column?.collectionId) {
      this.store$.dispatch(
        new CollectionsAction.RenameAttribute({
          collectionId: column.collectionId,
          attributeId: column.attribute.id,
          name,
        })
      );
    } else if (column?.linkTypeId) {
      this.store$.dispatch(
        new LinkTypesAction.RenameAttribute({
          linkTypeId: column.linkTypeId,
          attributeId: column.attribute.id,
          name,
        })
      );
    }
  }

  public deleteAttribute(column: TableColumn) {
    const attributeId = column?.attribute?.id;
    let action: Action;
    if (attributeId && column.collectionId) {
      action = new CollectionsAction.RemoveAttribute({collectionId: column.collectionId, attributeId});
    } else if (column?.attribute?.id && column.linkTypeId) {
      action = new LinkTypesAction.DeleteAttribute({linkTypeId: column.linkTypeId, attributeId});
    }

    if (action) {
      const title = this.i18n({id: 'table.delete.column.dialog.title', value: 'Delete this column?'});
      const message = this.i18n({
        id: 'table.delete.column.dialog.message',
        value: 'Do you really want to delete the column? This will permanently remove the attribute and all its data.',
      });

      this.store$.dispatch(new NotificationsAction.Confirm({title, message, action, type: 'danger'}));
    }
  }

  public setDisplayedAttribute(column: TableColumn) {
    this.store$.dispatch(
      new CollectionsAction.SetDefaultAttribute({
        attributeId: column.attribute.id,
        collectionId: column.collectionId,
      })
    );
  }

  public saveRowNewValue(row: TableRow, column: TableColumn, value: any) {
    if (column.attribute) {
      this.patchColumnData(row, column, value);
    } else {
      this.stateService.setRowValue(row, column, value);
      this.setPendingRowValue(row, column, value);

      if (!this.isColumnCreating(column)) {
        this.createAttribute(column, column.name);
      }
    }
  }

  public createNewDocument(row: TableNewRow, column: TableColumn, value: any) {
    if (column.attribute) {
      this.createDocument(row, column, value);
    } else {
      this.stateService.setNewRowValue(column, value);
      this.setPendingRowValue(row, column, value);

      if (!this.isColumnCreating(column)) {
        this.createAttribute(column, column.name);
      }
    }
  }

  private createDocument(row: TableNewRow, column: TableColumn, value: any) {
    if (this.isRowCreating(row)) {
      this.stateService.setNewRowValue(column, value);
      this.setPendingRowValue(row, column, value);
      return;
    }

    this.stateService.startRowCreating(row, column, value);
    const data = {
      ...this.rowValues(row),
      ...this.createPendingRowValues(row),
      [column.attribute.id]: value,
    };
    if (column.collectionId) {
      const document: DocumentModel = {
        correlationId: row.id,
        collectionId: column.collectionId,
        data,
      };
      this.store$.dispatch(
        new DocumentsAction.Create({
          document,
          onSuccess: () => this.beforeRowCreated(row),
          afterSuccess: documentId => this.onRowCreated(row, data, documentId),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    } else if (column.linkTypeId) {
      // TODO create with link
    }
  }

  private beforeRowCreated(row: TableNewRow) {
    const tables = [...this.stateService.tables];
    const tableIndex = tables.findIndex(table => table.id === row.tableId);
    if (tables[tableIndex]?.newRow?.id === row.id) {
      const newRow = {
        ...createEmptyNewRow(row.tableId),
        documentMenuItems: row.documentMenuItems,
        linkMenuItems: row.linkMenuItems,
        data: tables[tableIndex].newRowData,
      };
      tables[tableIndex] = {...tables[tableIndex], newRow};
      this.stateService.setTables(tables);
      this.pendingCorrelationIds.push(row.correlationId || row.id);
    }
  }

  private rowValues(row: TableRow): Record<string, any> {
    return this.stateService.findTableColumns(row.tableId).reduce((result, column) => {
      if (row.data[column.id] && column.attribute) {
        result[column.attribute.id] = row.data[column.id];
      }
      return result;
    }, {});
  }

  private createPendingRowValues(row: TableRow): Record<string, any> {
    return this.stateService.findTableColumns(row.tableId).reduce((result, column) => {
      if (column.attribute) {
        const pendingRowUpdate = this.findPendingRowUpdate(column, row);
        if (pendingRowUpdate) {
          result[column.attribute.id] = pendingRowUpdate.value;
        }
      }
      return result;
    }, {});
  }

  private findPendingRowUpdate(column: TableColumn, row: TableRow): PendingRowUpdate {
    const pendingValues = this.pendingColumnValues[column.id];
    return pendingValues?.find(pending => pending.row.id === row.id);
  }

  private onRowCreated(row: TableRow, data: Record<string, any>, documentId: string, linkInstanceId?: string) {
    const columns = this.stateService.findTableColumns(row.tableId);
    const patchData: Record<string, any> = {};
    const patchLinkData: Record<string, any> = {};
    let collectionId: string;
    let linkTypeId: string;

    const usedAttributeIds = Object.keys(data);
    for (const column of columns.filter(col => !!col.attribute)) {
      const updates = this.pendingColumnValues[column.id] || [];
      const rowUpdateIndex = updates.findIndex(update => update.row.id === row.id);
      const columnUpdate = updates[rowUpdateIndex];
      if (rowUpdateIndex !== -1) {
        updates.splice(rowUpdateIndex, 1);
        if (!usedAttributeIds.includes(column.attribute.id)) {
          if (column.collectionId) {
            collectionId = column.collectionId;
            patchData[column.attribute.id] = columnUpdate.value;
          } else if (column.linkTypeId) {
            linkTypeId = column.linkTypeId;
            patchLinkData[column.attribute.id] = columnUpdate.value;
          }
        }
      }
    }

    const currentSelectedCell = this.stateService.selectedCell;
    const selectedColumnId =
      currentSelectedCell?.tableId === row.tableId ? currentSelectedCell.columnId : columns[0].id;

    this.stateService.setSelectedCellWithDelay({
      tableId: row.tableId,
      columnId: selectedColumnId,
      rowId: row.id,
      linkId: linkInstanceId,
      type: TableCellType.Body,
    });

    if (collectionId && Object.keys(patchData).length) {
      this.patchData({...row, documentId}, patchData, collectionId);
    } else if (linkTypeId && Object.keys(patchLinkData).length) {
      this.patchData({...row, documentId, linkInstanceId}, patchLinkData, null, linkTypeId);
    }
  }

  private setPendingRowValue(row: TableRow, column: TableColumn, value: any) {
    this.pendingColumnValues[column.id] = this.pendingColumnValues[column.id] || [];
    const rowUpdate = this.pendingColumnValues[column.id].find(update => update.row.id === row.id);
    if (rowUpdate) {
      rowUpdate.value = value;
    } else {
      this.pendingColumnValues[column.id].push({row, value});
    }
  }

  private patchColumnData(row: TableRow, column: TableColumn, value: any) {
    const patchData = {[column.attribute.id]: value};
    this.patchData(row, patchData, column.collectionId, column.linkTypeId);
  }

  private patchData(row: TableRow, data: Record<string, any>, collectionId?: string, linkTypeId?: string) {
    if (collectionId && row.documentId) {
      const document: DocumentModel = {id: row.documentId, collectionId, data};
      this.store$.dispatch(new DocumentsAction.PatchData({document}));
    } else if (linkTypeId && row.linkInstanceId) {
      const linkInstance: LinkInstance = {id: row.linkInstanceId, linkTypeId, data, documentIds: ['', '']};
      this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
    }
  }

  public copyTableColumn(table: TableModel, column: TableColumn): TableColumn {
    const columnNames = table?.columns.map(col => col.name || col.attribute?.name) || [];
    const copiedColumn = {
      ...column,
      id: generateId(),
      attribute: undefined,
      creating: undefined,
      default: false,
      hidden: false,
      name: generateAttributeName(columnNames),
      menuItems: [],
    };
    const permissions = this.stateService.getColumnPermissions(column);
    copiedColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, copiedColumn, true));
    return copiedColumn;
  }

  public resetSidebar() {
    this.store$.dispatch(new WorkflowsAction.ResetOpenedDocument());
  }

  public createNewRow(tableId: string) {
    const table = this.stateService.findTable(tableId);
    if (table.linkingCollectionId) {
      this.modalService.showChooseLinkDocumentByCollection(table.linkingCollectionId, document =>
        this.stateService.initiateNewRow(tableId, document.id)
      );
    } else if (table.linkingDocumentIds?.length) {
      this.modalService.showChooseLinkDocument(table.linkingDocumentIds, document =>
        this.stateService.initiateNewRow(tableId, document.id)
      );
    } else {
      this.stateService.initiateNewRow(tableId);
    }
  }
}

function createRowDataFromAggregated(
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

function createRowData(data: Record<string, any>, columnIdsMap: Record<string, string>): Record<string, any> {
  return Object.keys(data || {}).reduce((rowData, attributeId) => {
    if (columnIdsMap[attributeId]) {
      rowData[columnIdsMap[attributeId]] = data[attributeId];
    }
    return rowData;
  }, {});
}

function createColumnIdsMap(columns: TableColumn[]): Record<string, string> {
  return columns.reduce((idsMap, column) => {
    if (column.attribute) {
      idsMap[column.attribute.id] = column.id;
    }
    return idsMap;
  }, {});
}

function createPendingColumnValuesByRow(pendingValues: Record<string, PendingRowUpdate[]>): Record<string, any> {
  return Object.keys(pendingValues).reduce((result, columnId) => {
    const updates = pendingValues[columnId];
    for (const update of updates) {
      if (!result[update.row.id]) {
        result[update.row.id] = {};
      }
      result[update.row.id][columnId] = update.value;
    }
    return result;
  }, {});
}
