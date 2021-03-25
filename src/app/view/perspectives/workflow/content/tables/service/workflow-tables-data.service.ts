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

import {Injectable} from '@angular/core';
import {AppState} from '../../../../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {TableNewRow, TableRow} from '../../../../../../shared/table/model/table-row';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../../core/store/link-instances/link-instances.action';
import {distinctUntilChanged, filter, map, mergeMap, skip, take} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {AttributeSortType, ResourceAttributeSettings, ViewSettings} from '../../../../../../core/store/views/view';
import {
  TABLE_COLUMN_WIDTH,
  TABLE_ROW_HEIGHT,
  TableCell,
  TableCellType,
  TableModel,
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
import {
  findAttributeByQueryAttribute,
  QueryAttribute,
  queryAttributePermissions,
} from '../../../../../../core/model/query-attribute';
import {WorkflowTable} from '../../../model/workflow-table';
import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {queryStemsAreSame} from '../../../../../../core/store/navigation/query/query.util';
import {deepObjectsEquals, isArray, objectsByIdMap} from '../../../../../../shared/utils/common.utils';
import {groupTableColumns, numberOfOtherColumnsBefore} from '../../../../../../shared/table/model/table-utils';
import {
  selectWorkflowId,
  selectWorkflowSelectedDocumentId,
} from '../../../../../../core/store/workflows/workflow.state';
import {WorkflowsAction} from '../../../../../../core/store/workflows/workflows.action';
import {generateDocumentDataByResourceQuery} from '../../../../../../core/store/documents/document.utils';
import {
  computeTableHeight,
  createAggregatedLinkingDocumentsIds,
  createAggregatorAttributes,
  createColumnIdsMap,
  createEmptyNewRow,
  createLinkingCollectionId,
  createLinkTypeData,
  createPendingColumnValuesByRow,
  createRowData,
  createRowObjectsFromAggregated,
  createRowValues,
  isWorkflowStemConfigGroupedByResourceType,
  PendingRowUpdate,
  sortWorkflowTables,
  viewCursorToWorkflowCell,
  workflowTableId,
} from './workflow-utils';
import {selectLinkInstanceById} from '../../../../../../core/store/link-instances/link-instances.state';
import {getOtherDocumentIdFromLinkInstance} from '../../../../../../core/store/link-instances/link-instance.utils';
import {Observable} from 'rxjs';
import {selectDocumentById} from '../../../../../../core/store/documents/documents.state';
import {CopyValueService} from '../../../../../../core/service/copy-value.service';
import {selectViewCursor} from '../../../../../../core/store/navigation/navigation.state';
import {selectCurrentView} from '../../../../../../core/store/views/views.state';
import {Constraint, ConstraintData, UnknownConstraint} from '@lumeer/data-filters';

@Injectable()
export class WorkflowTablesDataService {
  private pendingColumnValues: Record<string, PendingRowUpdate[]> = {};
  private pendingCorrelationIds: string[] = [];
  private isViewActive: boolean;
  private dataAggregator: DataAggregator;

  constructor(
    private store$: Store<AppState>,
    private menuService: WorkflowTablesMenuService,
    private stateService: WorkflowTablesStateService,
    private modalService: ModalService,
    private constraintItemsFormatter: SelectItemWithConstraintFormatter,
    private copyValueService: CopyValueService
  ) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatWorkflowValue(value, constraint, data, aggregatorAttribute)
    );
    this.store$.pipe(select(selectCurrentView)).subscribe(view => (this.isViewActive = !!view));
    this.stateService.selectedCell$
      .pipe(
        skip(1),
        distinctUntilChanged((a, b) => deepObjectsEquals(a, b))
      )
      .subscribe(cell => {
        const column = cell && this.stateService.findTableColumn(cell.tableId, cell.columnId);
        this.store$.dispatch(new WorkflowsAction.SetSelectedCell({cell, column}));
      });
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
    const serializedValue = finalConstraint.createDataValue(value, constraintData).serialize();
    if (serializedValue && isArray(serializedValue)) {
      return serializedValue[0]; // i.e. multiselect constraints (user, select) serialize value as array
    }
    return serializedValue;
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
    this.checkInitialSelection(tables);
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
        const linkColumnIdsMap = createColumnIdsMap(linkColumns);
        const columnIdsMap = createColumnIdsMap(collectionColumns);
        const stemTableSettings = config.tables?.filter(
          tab => queryStemsAreSame(tab.stem, stemConfig.stem) && tab.collectionId === collection.id
        );
        const isGroupedByCollection = isWorkflowStemConfigGroupedByResourceType(
          stemConfig,
          AttributesResourceType.Collection
        );
        const isGroupedByLink = isWorkflowStemConfigGroupedByResourceType(stemConfig, AttributesResourceType.LinkType);
        const linkingCollectionId = createLinkingCollectionId(stemConfig, collections, linkTypesMap);
        const newRowData = this.createNewRowData(collection, linkType, columnIdsMap, linkColumnIdsMap);

        const tables = [];
        if (aggregatedData.items.length) {
          for (const aggregatedDataItem of aggregatedData.items) {
            const title = aggregatedDataItem.value?.toString() || '';
            const tableId = workflowTableId(stemConfig.stem, title);
            const titleDataValue = constraint.createDataValue(title, constraintData);
            const titleDataResources = aggregatedDataItem.dataResources;
            for (const childItem of aggregatedDataItem.children || []) {
              const currentTable = currentTables.find(table => table.id === tableId) || tableByCollection;
              const {rows, newRow} = this.createRows(
                tableId,
                currentTable?.rows || [],
                currentTable?.newRow,
                createRowObjectsFromAggregated(
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

              const newRowDataAggregated = {
                ...newRowData,
                ...createRowValues(isGroupedByCollection ? {[attribute.id]: title} : {}, columnIdsMap),
                ...createRowValues(isGroupedByLink ? {[attribute.id]: title} : {}, linkColumnIdsMap),
              };

              const tableSettings = stemTableSettings?.find(tab => tab.value === title);
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
                maxHeight: computeTableHeight(rows.length, newRow),
                minHeight: computeTableHeight(Math.min(rows.length, 1), newRow),
                height: tableSettings?.height || computeTableHeight(Math.min(rows.length, 5), newRow),
                width: columnsWidth + 1, // + 1 for border
                newRow: newRow ? {...newRow, tableId, data: newRow.data || newRowDataAggregated} : undefined,
                newRowData,
                linkingDocumentIds:
                  !linkingCollectionId && createAggregatedLinkingDocumentsIds(aggregatedDataItem, childItem),
                linkingCollectionId,
              };
              tables.push(workflowTable);
            }
          }
        } else {
          const tableId = workflowTableId(stemConfig.stem);

          const {rows, newRow} = this.createRows(
            tableId,
            tableByCollection?.rows || [],
            tableByCollection?.newRow,
            [],
            linkColumnIdsMap,
            columnIdsMap,
            linkPermissions,
            collectionPermissions
          );

          const height = computeTableHeight(rows.length, newRow);
          const workflowTable: WorkflowTable = {
            id: tableId,
            columns: columns.map(column => ({...column, tableId})),
            rows,
            collectionId: collection.id,
            linkTypeId: linkType?.id,
            stem: stemConfig.stem,
            maxHeight: height,
            minHeight: height,
            height,
            width: columnsWidth + 1, // + 1 for border
            newRow: newRow ? {...newRow, tableId, data: newRow.data || newRowData} : undefined,
            newRowData,
            linkingCollectionId,
          };
          tables.push(workflowTable);
        }

        result.tables.push(...sortWorkflowTables(tables, stemConfig, viewSettings));
        result.actions.push(...linkActions);
        result.actions.push(...collectionActions);
        return result;
      },
      {tables: [], actions: []}
    );
  }

  private createNewRowData(
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
      ...createRowValues(documentData, collectionColumnsMap),
      ...createRowValues(linkData, linkColumnsMap),
    };
  }

  private aggregateData(stemConfig: WorkflowStemConfig, attribute: Attribute): AggregatedArrayData {
    const aggregatorAttributes = createAggregatorAttributes(stemConfig, attribute);
    const aggregatedData = this.dataAggregator.aggregateArray(aggregatorAttributes, []);
    if (aggregatedData.levels > 2) {
      // tables creation expect only two levels so we need to merge additional levels
      const items: AggregatedDataItem[] = [];
      for (const item of aggregatedData.items) {
        const children = item.children.reduce((array, child) => {
          const nextChild = child.children?.[0];
          const dataResourcesChains = child.dataResourcesChains.map((chain, index) => [
            ...chain,
            ...(nextChild?.dataResourcesChains?.[index] || []),
          ]);
          array.push({...(nextChild || child), dataResourcesChains});
          return array;
        }, []);
        items.push({...item, children, dataResourcesChains: []});
      }

      return {items, levels: 2};
    }
    return aggregatedData;
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
    attributeSettings: ResourceAttributeSettings[],
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
    const attributeColumns = createAttributesSettingsOrder(resource.attributes, attributeSettings).reduce<
      TableColumn[]
    >((columns, setting) => {
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
        permissions: permissions,
        sort: setting.sort,
        menuItems: [],
      };
      column.menuItems.push(...this.menuService.createHeaderMenu(permissions, column, true, otherPermissions));
      if (columnByName) {
        mappedUncreatedColumns[column.id] = column;
        return columns;
      }

      if (!setting.hidden || permissions?.read || permissions?.manageWithView) {
        columns.push(column);
      }
      return columns;
    }, []);

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

    if (
      !this.isViewActive &&
      isCollection &&
      permissions.manageWithView &&
      !attributeColumns.some(column => !column.attribute)
    ) {
      const lastColumn: TableColumn = {
        id: generateId(),
        name: generateAttributeName(columnNames),
        collectionId: isCollection ? resource.id : null,
        linkTypeId: isCollection ? null : resource.id,
        editable: true,
        width: TABLE_COLUMN_WIDTH,
        permissions,
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
        permissions,
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

    const pendingColumnValuesByRow = createPendingColumnValuesByRow(this.pendingColumnValues);

    const rows = data.map(object => {
      const objectId = object.linkInstance?.id || object.document.id;
      const objectCorrelationId = object.linkInstance?.correlationId || object.document.correlationId;
      const currentRow = rowsMap[objectCorrelationId || objectId] || rowsMap[objectId];
      const documentData = createRowValues(object.document.data, columnIdsMap);
      const linkData = createRowValues(object.linkInstance?.data, linkColumnIdsMap);
      const isNewlyCreatedRow = this.pendingCorrelationIds.includes(objectCorrelationId);
      const pendingData = isNewlyCreatedRow
        ? pendingColumnValuesByRow[objectCorrelationId]
        : (currentRow && pendingColumnValuesByRow[currentRow.id]) || {};
      const id = isNewlyCreatedRow ? objectCorrelationId : currentRow?.id || generateId();
      const row: TableRow = {
        id,
        tableId,
        data: {...documentData, ...linkData, ...pendingData},
        documentId: object.document.id,
        linkInstanceId: object.linkInstance?.id,
        height: currentRow?.height || TABLE_ROW_HEIGHT,
        correlationId: objectCorrelationId || id,
        commentsCount: object.document ? object.document.commentsCount : object.linkInstance.commentsCount,
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
        newRow = {...currentNewRow, data: currentNewRow?.creating ? currentNewRow.data : null};
      } else {
        newRow = createEmptyNewRow(tableId);
      }
      newRow.documentMenuItems = this.menuService.createRowMenu(collectionPermissions, newRow);
      newRow.linkMenuItems = this.menuService.createRowMenu(linkPermissions, newRow);
    }

    return {rows, newRow};
  }

  public moveColumns(table: TableModel, from: number, to: number) {
    const columns = this.stateService.columns(table.id);
    const fromWithoutOther = from - numberOfOtherColumnsBefore(from, columns);
    const toWithoutOther = to - numberOfOtherColumnsBefore(to, columns);
    const column = columns[from];

    // prevent from detect change for settings
    this.stateService.syncColumnSettingsBeforeMove(column, fromWithoutOther, toWithoutOther);
    this.stateService.moveColumns(table, from, to);

    if (column?.attribute && fromWithoutOther !== toWithoutOther && toWithoutOther >= 0) {
      const {collection, linkType} = this.stateService.findColumnResourcesByColumn(column);
      this.store$.dispatch(
        new ViewSettingsAction.MoveAttribute({
          from: fromWithoutOther,
          to: toWithoutOther,
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
      if (update.row) {
        const freshRow = this.stateService?.findTableRow(update.row.tableId, update.row.id) || update.row;
        this.patchColumnData(freshRow, newColumn, update.value);
        deleteRows.push(freshRow.id);
      } else if (update.newRow) {
        const rowInBody = this.stateService?.findTableRow(update.newRow.tableId, update.newRow.id);
        if (rowInBody) {
          this.patchColumnData(rowInBody, newColumn, update.value);
          deleteRows.push(rowInBody.id);
        } else {
          const freshRow = this.stateService?.findTable(update.newRow.tableId)?.newRow || update.newRow;
          this.createDocument(freshRow, newColumn, update.value);
        }
      }
    }

    if (this.pendingColumnValues?.[column.id]) {
      this.pendingColumnValues[column.id] = this.pendingColumnValues[column.id].filter(
        update => !update.row || !deleteRows.includes(update.row.id)
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

  public showRowDocumentDetail(row: TableRow, cell?: TableCell) {
    const column = cell && this.stateService.findTableColumn(cell.tableId, cell.columnId);
    this.store$.dispatch(new WorkflowsAction.SetOpenedDocument({documentId: row.documentId, cell, column}));
  }

  public showAttributeType(column: TableColumn) {
    this.stateService.resetSelectedCell();
    this.modalService.showAttributeType(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public showAttributeDescription(column: TableColumn) {
    this.stateService.resetSelectedCell();
    this.modalService.showAttributeDescription(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public showAttributeFunction(column: TableColumn) {
    this.stateService.resetSelectedCell();
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
      const title = $localize`:@@table.delete.column.dialog.title:Delete this column?`;
      const message = $localize`:@@table.delete.column.dialog.message:Do you really want to delete the column? This will permanently remove the attribute and all its data.`;

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
      this.setPendingNewRowValue(row, column, value);

      if (!this.isColumnCreating(column)) {
        this.createAttribute(column, column.name);
      }
    }
  }

  private createDocument(row: TableNewRow, column: TableColumn, value: any) {
    if (this.isRowCreating(row)) {
      this.stateService.setNewRowValue(column, value);
      this.setPendingNewRowValue(row, column, value);
      return;
    }

    this.stateService.startRowCreatingWithValue(row, column, value);
    this.pendingCorrelationIds.push(row.correlationId || row.id);

    const table = this.stateService.findTable(row.tableId);
    const {data, linkData} = createRowData(row, table?.columns || [], this.pendingColumnValues, column, value);
    const document: DocumentModel = {
      correlationId: row.id,
      collectionId: table.collectionId,
      data,
    };

    if (row.linkedDocumentId) {
      const linkInstance: LinkInstance = {
        data: linkData,
        correlationId: row.correlationId,
        linkTypeId: table.linkTypeId,
        documentIds: [row.linkedDocumentId, ''],
      };
      this.store$.dispatch(
        new DocumentsAction.CreateWithLink({
          document,
          linkInstance,
          otherDocumentId: row.linkedDocumentId,
          afterSuccess: ({documentId, linkInstanceId}) => this.onRowCreated(row, data, documentId, linkInstanceId),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    } else {
      this.store$.dispatch(
        new DocumentsAction.Create({
          document,
          afterSuccess: documentId => this.onRowCreated(row, data, documentId),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    }
  }

  public createOrUpdateLink(row: TableRow, document: DocumentModel) {
    const table = this.stateService.findTable(row.tableId);
    this.pendingCorrelationIds.push(row.correlationId || row.id);

    const {linkData} = createRowData(row, table?.columns || [], this.pendingColumnValues);
    if (row.linkInstanceId) {
      this.store$.pipe(select(selectLinkInstanceById(row.linkInstanceId)), take(1)).subscribe(linkInstance => {
        const otherDocumentId = getOtherDocumentIdFromLinkInstance(linkInstance, row.documentId);
        this.store$.dispatch(
          new LinkInstancesAction.ChangeDocuments({
            linkInstanceId: row.linkInstanceId,
            documentIds: [otherDocumentId, document.id],
            afterSuccess: () => this.onLinkRowUpdated(row, document.id, row.linkInstanceId),
          })
        );
      });
    } else {
      const newRowData = {...row.data, ...this.mapDocumentData(table?.columns || [], document)};
      this.stateService.startRowCreating(row, newRowData, document.id);
      const newRow = <TableNewRow>row;
      const linkInstance: LinkInstance = {
        data: linkData,
        correlationId: row.correlationId,
        linkTypeId: table.linkTypeId,
        documentIds: [document.id, newRow.linkedDocumentId],
      };
      this.store$.dispatch(
        new LinkInstancesAction.Create({
          linkInstance,
          afterSuccess: linkInstanceId => this.onLinkRowUpdated(newRow, document.id, linkInstanceId),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    }
  }

  private onLinkRowUpdated(row: TableRow, documentId: string, linkInstanceId: string) {
    this.checkSelectedOnRowUpdated(row, documentId, linkInstanceId);
  }

  private mapDocumentData(columns: TableColumn[], document: DocumentModel): Record<string, any> {
    return columns.reduce((data, column) => {
      if (column.collectionId && column.attribute) {
        data[column.id] = document.data?.[column.attribute.id];
      }
      return data;
    }, {});
  }

  private onRowCreated(row: TableNewRow, data: Record<string, any>, documentId: string, linkInstanceId?: string) {
    const columns = this.stateService.findTableColumns(row.tableId);
    const patchData: Record<string, any> = {};
    const patchLinkData: Record<string, any> = {};
    let collectionId: string;
    let linkTypeId: string;

    const usedAttributeIds = Object.keys(data).filter(attributeId => data[attributeId]);
    for (const column of columns.filter(col => !!col.attribute)) {
      const updates = this.pendingColumnValues[column.id] || [];
      const rowUpdateIndex = updates.findIndex(update => update.newRow?.id === row.id);
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

    this.checkSelectedOnRowUpdated(row, documentId, linkInstanceId);

    if (collectionId && Object.keys(patchData).length) {
      this.patchData({...row, documentId}, patchData, collectionId);
    } else if (linkTypeId && Object.keys(patchLinkData).length) {
      this.patchData({...row, documentId, linkInstanceId}, patchLinkData, null, linkTypeId);
    }
  }

  private checkSelectedOnRowUpdated(row: TableRow, documentId: string, linkId: string) {
    if (this.stateService.isRowSelected(row)) {
      this.stateService.setSelectedCellWithDelay({
        tableId: row.tableId,
        columnId: this.stateService.selectedCell.columnId,
        rowId: row.id,
        documentId,
        linkId,
        type: TableCellType.Body,
      });
    }
  }

  private setPendingRowValue(row: TableRow, column: TableColumn, value: any) {
    this.pendingColumnValues[column.id] = this.pendingColumnValues[column.id] || [];
    const rowUpdate = this.pendingColumnValues[column.id].find(update => update.row?.id === row.id);
    if (rowUpdate) {
      rowUpdate.value = value;
    } else {
      this.pendingColumnValues[column.id].push({row, value});
    }
  }

  private setPendingNewRowValue(newRow: TableNewRow, column: TableColumn, value: any) {
    this.pendingColumnValues[column.id] = this.pendingColumnValues[column.id] || [];
    const rowUpdate = this.pendingColumnValues[column.id].find(update => update.newRow?.id === newRow.id);
    if (rowUpdate) {
      rowUpdate.value = value;
    } else {
      this.pendingColumnValues[column.id].push({newRow, value});
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
      if (table.linkingDocumentIds.length === 1) {
        this.stateService.initiateNewRow(tableId, table.linkingDocumentIds[0]);
      } else {
        this.modalService.showChooseLinkDocument(table.linkingDocumentIds, document =>
          this.stateService.initiateNewRow(tableId, document.id)
        );
      }
    } else {
      this.stateService.initiateNewRow(tableId);
    }
  }

  public onCellClick(cell: TableCell) {
    this.selectSidebarOpened$().subscribe(opened => {
      if (opened) {
        const row = this.stateService.findTableRow(cell.tableId, cell.rowId);
        if (row) {
          this.showRowDocumentDetail(row, cell);
        }
        this.stateService.setSelectedCell({...cell});
      } else {
        this.stateService.setSelectedCell({...cell});
      }
    });
  }

  private selectSidebarOpened$(): Observable<boolean> {
    return this.store$.pipe(
      select(selectWorkflowSelectedDocumentId),
      mergeMap(documentId => this.store$.pipe(select(selectDocumentById(documentId)))),
      take(1),
      map(document => !!document)
    );
  }

  public copySelectedCell() {
    if (!this.stateService.isSelected()) {
      return;
    }
    const selectedCell = this.stateService.selectedCell;
    const tableColumn = this.stateService.findTableColumn(selectedCell.tableId, selectedCell.columnId);
    if (selectedCell.type === TableCellType.Header) {
      this.copyColumnName(tableColumn);
    } else if (selectedCell.type === TableCellType.Body) {
      const row = this.stateService.findTableRow(selectedCell.tableId, selectedCell.rowId);
      this.copyRowValue(row, tableColumn);
    } else if (selectedCell.type === TableCellType.NewRow) {
      const table = this.stateService.findTable(selectedCell.tableId);
      this.copyNewRowValue(table.newRow, tableColumn);
    }
  }

  public copyColumnName(column: TableColumn) {
    this.copyValueService.copy(column.attribute?.name || column.name);
  }

  public copyColumnValues(column: TableColumn, unique?: boolean) {
    const table = this.stateService.findTableByColumn(column);
    const constraint = column.attribute.constraint;
    const dataValues = table?.rows?.map(row =>
      constraint.createDataValue(row.data?.[column.id], this.stateService.constraintData)
    );
    this.copyValueService.copyDataValues(dataValues, constraint, unique);
  }

  public copyRowValue(row: TableRow, column: TableColumn) {
    if (row && column?.attribute) {
      if (column.collectionId) {
        this.copyValueService.copyDocumentValue(row.documentId, column.collectionId, column.attribute.id);
      } else if (column.linkTypeId) {
        this.copyValueService.copyLinkValue(row.linkInstanceId, column.linkTypeId, column.attribute.id);
      }
    }
  }

  public copyNewRowValue(row: TableNewRow, column: TableColumn) {
    if (column) {
      const value = row.data?.[column.id];
      this.copyValueService.copy(value);
    }
  }

  private checkInitialSelection(tables: WorkflowTable[]) {
    this.store$
      .pipe(
        select(selectViewCursor),
        take(1),
        filter(cursor => !!cursor)
      )
      .subscribe(cursor => {
        if (!this.stateService.isSelected() && !this.stateService.isEditing()) {
          const cell = viewCursorToWorkflowCell(cursor, tables);
          if (cell) {
            this.stateService.setSelectedCell(cell);
          }
        }
      });
  }
}
