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
import {ColumnFilter, TableColumn} from '../../../../../../shared/table/model/table-column';
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../../core/store/link-instances/link-instances.action';
import {distinctUntilChanged, filter, map, mergeMap, skip, take} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions, ResourcesPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query, QueryStem} from '../../../../../../core/store/navigation/query/query';
import {
  AttributeSortType,
  ResourceAttributeSettings,
  View,
  ViewSettings,
} from '../../../../../../core/store/views/view';
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
import {viewSettingsChanged, viewSettingsSortChanged} from '../../../../../../core/store/views/view.utils';
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
import {
  filterQueryByStem,
  getQueryFiltersForResource,
  queryStemsAreSame,
} from '../../../../../../core/store/navigation/query/query.util';
import {
  deepObjectsEquals,
  findIthItemIndex,
  isArray,
  objectsByIdMap,
} from '../../../../../../shared/utils/common.utils';
import {groupTableColumns, numberOfOtherColumnsBefore} from '../../../../../../shared/table/model/table-utils';
import {
  selectWorkflowId,
  selectWorkflowSelectedDocumentId,
} from '../../../../../../core/store/workflows/workflow.state';
import {WorkflowsAction} from '../../../../../../core/store/workflows/workflows.action';
import {
  generateDocumentDataByResourceQuery,
  getDocumentsAndLinksByStemData,
} from '../../../../../../core/store/documents/document.utils';
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
import {
  AttributeFilter,
  ConditionType,
  ConditionValue,
  Constraint,
  ConstraintData,
  DocumentsAndLinksData,
  UnknownConstraint,
} from '@lumeer/data-filters';
import {filterUniqueWorkflowConfigStems} from '../../../../../../core/store/workflows/workflow.utils';
import {columnBackgroundColor} from '../../../../../../shared/utils/color.utils';
import {NavigationAction} from '../../../../../../core/store/navigation/navigation.action';
import {CommonAction} from '../../../../../../core/store/common/common.action';
import {RoleType} from '../../../../../../core/model/role-type';

@Injectable()
export class WorkflowTablesDataService {
  private readonly dataAggregator: DataAggregator;

  private pendingColumnValues: Record<string, PendingRowUpdate[]> = {}; // grouped by columnId
  private lockedRowIds: Record<string, string[]> = {}; // grouped by tableId
  private currentView: View;

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
    this.store$.pipe(select(selectCurrentView)).subscribe(view => (this.currentView = view));
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
        this.stateService.linkTypes,
        this.stateService.data,
        this.stateService.config,
        this.stateService.permissions,
        this.stateService.query,
        viewSettings,
        this.stateService.constraintData,
        this.stateService.canManageConfig,
        viewSettingsSortChanged(this.stateService.viewSettings, viewSettings)
      );
    }
  }

  public createAndSyncTables(
    collections: Collection[],
    linkTypes: LinkType[],
    data: DocumentsAndLinksData,
    config: WorkflowConfig,
    permissions: ResourcesPermissions,
    query: Query,
    viewSettings: ViewSettings,
    constraintData: ConstraintData,
    canManageConfig: boolean,
    resetLockedRows?: boolean
  ) {
    resetLockedRows && this.resetLockedRows();

    const currentTables = this.stateService.tables;
    this.stateService.updateData(
      collections,
      linkTypes,
      data,
      config,
      permissions,
      query,
      viewSettings,
      constraintData,
      canManageConfig
    );

    const {tables, actions} = this.createTablesAndSyncActions(
      currentTables,
      collections,
      linkTypes,
      data,
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
    linkTypes: LinkType[],
    data: DocumentsAndLinksData,
    config: WorkflowConfig,
    permissions: ResourcesPermissions,
    query: Query,
    viewSettings: ViewSettings,
    constraintData: ConstraintData
  ): {tables: WorkflowTable[]; actions: Action[]} {
    const collectionsMap = objectsByIdMap(collections);
    const linkTypesMap = objectsByIdMap(linkTypes);
    return filterUniqueWorkflowConfigStems(config).reduce(
      (result, stemConfig) => {
        const collection = collectionsMap[stemConfig.collection?.resourceId];
        if (!collection) {
          return result;
        }

        const {documents: stemDocuments, linkInstances: stemLinkInstances} = getDocumentsAndLinksByStemData(
          data,
          stemConfig.stem
        );
        const linkInstancesMap = objectsByIdMap(stemLinkInstances);

        // creating collection columns
        const tableByCollection = currentTables.find(tab => tab.collectionId === collection.id);
        const currentCollectionColumns = (tableByCollection?.columns || []).filter(column => column.collectionId);
        const {linkType, permissions: linkPermissions} = createLinkTypeData(
          stemConfig,
          collections,
          permissions,
          linkTypesMap
        );
        const queryByStem = filterQueryByStem(query, stemConfig.stem);
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
          viewSettings,
          queryByStem,
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
          queryByStem
        );

        // aggregate documents and links to create rows
        const attribute = findAttributeByQueryAttribute(stemConfig.attribute, collections, linkTypes);
        this.dataAggregator.updateData(
          collections,
          stemDocuments,
          linkTypes,
          stemLinkInstances,
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
        const isGroupedByCollection =
          attribute && isWorkflowStemConfigGroupedByResourceType(stemConfig, AttributesResourceType.Collection);
        const isGroupedByLink =
          attribute && isWorkflowStemConfigGroupedByResourceType(stemConfig, AttributesResourceType.LinkType);
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
                createRowObjectsFromAggregated(
                  aggregatedDataItem,
                  childItem,
                  collection,
                  linkType,
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
                minHeight: computeTableHeight(rows, newRow, 1),
                height: tableSettings?.height || computeTableHeight(rows, newRow, 5),
                width: columnsWidth + 1, // + 1 for border
                newRow: newRow ? {...newRow, tableId, data: newRowDataAggregated} : undefined,
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
            [],
            linkColumnIdsMap,
            columnIdsMap,
            linkPermissions,
            collectionPermissions
          );

          const tableSettings = stemTableSettings?.find(tab => !tab.value);
          const workflowTable: WorkflowTable = {
            id: tableId,
            columns: columns.map(column => ({...column, tableId})),
            rows,
            collectionId: collection.id,
            linkTypeId: linkType?.id,
            stem: stemConfig.stem,
            minHeight: computeTableHeight(rows, newRow, 1),
            height: tableSettings?.height || computeTableHeight(rows, newRow),
            width: columnsWidth + 1, // + 1 for border
            newRow: newRow ? {...newRow, tableId, data: newRow.data || newRowData} : undefined,
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
    permissions: ResourcesPermissions,
    viewSettings: ViewSettings,
    query: Query,
    linkTypePermissions: AllowedPermissions
  ): {columns: TableColumn[]; actions: Action[]; permissions: AllowedPermissions} {
    const collectionPermissions = queryAttributePermissions(stemConfig.collection, permissions);
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

    const filters = getQueryFiltersForResource(query, resource.id, resourceType);
    const originalColor = isCollection ? (<Collection>resource).color : null;
    const color = columnBackgroundColor(originalColor);
    const newColumnColor = columnBackgroundColor(originalColor, true);
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
        filters: this.createColumnFilters(filters, attribute, query.stems[0], resource.id, resourceType),
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

      if (!setting.hidden || permissions?.roles?.Read) {
        columns.push(column);
      }
      return columns;
    }, []);

    const syncActions = [];
    const columnNames = (resource.attributes || []).map(attribute => attribute.name);
    for (let i = 0; i < currentColumns?.length; i++) {
      const column = {...currentColumns[i], color: newColumnColor};
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
      !this.currentView &&
      isCollection &&
      permissions.roles?.AttributeEdit &&
      !attributeColumns.some(column => !column.attribute)
    ) {
      const lastColumn: TableColumn = {
        id: generateId(),
        name: generateAttributeName(columnNames),
        collectionId: isCollection ? resource.id : null,
        linkTypeId: isCollection ? null : resource.id,
        editable: true,
        filters: [],
        width: TABLE_COLUMN_WIDTH,
        permissions,
        color: newColumnColor,
        menuItems: [],
      };
      lastColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, lastColumn, true));
      attributeColumns.push(lastColumn);
    }

    return {columns: attributeColumns, actions: syncActions};
  }

  private createColumnFilters(
    allFilters: AttributeFilter[],
    attribute: Attribute,
    stem: QueryStem,
    resourceId: string,
    resourceType: AttributesResourceType
  ): ColumnFilter[] {
    if (allFilters.length === 0) {
      return [];
    }
    const attributeFilters = allFilters.filter(filter => filter.attributeId === attribute.id);
    if (this.stateService.canManageConfig || !this.currentView) {
      return attributeFilters.map(filter => ({...filter, deletable: true}));
    }

    const currentViewSameStems = this.currentView?.query?.stems?.filter(s => queryStemsAreSame(s, stem)) || [];
    const currentViewFilters = getQueryFiltersForResource({stems: currentViewSameStems}, resourceId, resourceType);
    return attributeFilters.map((filter, index) => {
      const sameFiltersBefore = attributeFilters.slice(0, index).filter(f => deepObjectsEquals(f, filter)).length;
      const sameStemFilters = currentViewFilters.filter(f => deepObjectsEquals(f, filter)).length;
      const deletable = sameFiltersBefore >= sameStemFilters;

      return {...filter, deletable};
    });
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
        color: columnBackgroundColor(null),
        menuItems: [],
        filters: [],
      };
      lastColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, lastColumn, true));
      return lastColumn;
    }
    return null;
  }

  private createRows(
    tableId: string,
    currentRows: TableRow[],
    sortedData: {document: DocumentModel; linkInstance?: LinkInstance}[],
    linkColumnIdsMap: Record<string, string>,
    columnIdsMap: Record<string, string>,
    linkPermissions: AllowedPermissions,
    collectionPermissions: AllowedPermissions
  ): {rows: TableRow[]; newRow: TableRow} {
    const rowsMap = currentRows.reduce(
      (result, row) => ({
        ...result,
        [row.linkInstanceId || row.documentId || row.correlationId]: row,
      }),
      {}
    );

    const pendingColumnValuesByRow = createPendingColumnValuesByRow(this.pendingColumnValues);
    const lockedRowIds = this.lockedRowIds[tableId] || [];

    const {rows, lockedRows} = sortedData.reduce(
      (data, object) => {
        const objectId = object.linkInstance?.id || object.document.id;
        const objectCorrelationId = object.linkInstance?.correlationId || object.document.correlationId;
        const currentRow = rowsMap[objectCorrelationId || objectId] || rowsMap[objectId];
        const documentData = createRowValues(object.document.data, columnIdsMap);
        const linkData = createRowValues(object.linkInstance?.data, linkColumnIdsMap);
        const pendingData = (currentRow && pendingColumnValuesByRow[currentRow.id]) || {};
        const id = currentRow?.id || objectCorrelationId || generateId();
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
        row.documentMenuItems.push(
          ...this.menuService.createRowMenu(collectionPermissions, row, !!object.linkInstance)
        );
        row.linkMenuItems.push(...this.menuService.createRowMenu(linkPermissions, row, !!object.linkInstance));

        if (lockedRowIds.includes(row.id)) {
          data.lockedRows.push(row);
        } else {
          data.rows.push(row);
        }

        return data;
      },
      {rows: [], lockedRows: []}
    );

    const lockedRowsMap = objectsByIdMap(lockedRows);
    const lockedRowsWithUncreated = lockedRowIds
      .map(rowId => lockedRowsMap[rowId] || rowsMap[rowId])
      .filter(row => !!row);

    let newRow: TableRow;
    const canCreateNewRow = linkPermissions
      ? linkPermissions.rolesWithView?.DataContribute
      : collectionPermissions.rolesWithView?.[RoleType.DataContribute];
    if (canCreateNewRow) {
      newRow = createEmptyNewRow(tableId);
      newRow.documentMenuItems = this.menuService.createRowMenu(collectionPermissions, newRow);
      newRow.linkMenuItems = this.menuService.createRowMenu(linkPermissions, newRow);
    }

    return {rows: [...rows, ...lockedRowsWithUncreated], newRow};
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

  public removeFilter(column: TableColumn, index: number) {
    const table = this.stateService.findTableByColumn(column);
    const query = this.stateService.query;
    const stemsCopy = [...(query.stems || [])];

    const {stemIndex, numFiltersBefore} = this.findStemIndexForFilter(column, stemsCopy, index);

    const filtersParam: keyof QueryStem = table.collectionId ? 'filters' : 'linkFilters';
    if (stemIndex >= 0) {
      const stemCopy = {...stemsCopy[stemIndex]};
      const filtersCopy = [...stemCopy[filtersParam]];

      const finalIndexByAttribute = index - numFiltersBefore;
      const finalIndex = findIthItemIndex(
        filtersCopy,
        finalIndexByAttribute + 1,
        filter => filter.attributeId === column.attribute.id
      );

      filtersCopy.splice(finalIndex, 1);
      stemCopy[filtersParam] = filtersCopy as any;

      stemsCopy[stemIndex] = stemCopy;

      this.store$.dispatch(new NavigationAction.SetQuery({query: {...query, stems: stemsCopy}}));
    }
  }

  public changeFilter(
    column: TableColumn,
    index: number,
    condition: ConditionType,
    conditionValues: ConditionValue[],
    isNew?: boolean
  ) {
    const table = this.stateService.findTableByColumn(column);
    const query = this.stateService.query;
    const stemsCopy = [...(query.stems || [])];

    const {stemIndex, numFiltersBefore} = this.findStemIndexForFilter(column, stemsCopy, index, isNew);

    const filtersParam: keyof QueryStem = table.collectionId ? 'filters' : 'linkFilters';
    if (stemIndex >= 0) {
      const stemCopy = {...stemsCopy[stemIndex]};

      const filtersCopy = [...stemCopy[filtersParam]];
      if (isNew) {
        filtersCopy.push({
          collectionId: table.collectionId,
          linkTypeId: table.linkTypeId,
          attributeId: column.attribute.id,
          condition,
          conditionValues,
        });
      } else {
        const finalIndexByAttribute = index - numFiltersBefore;
        const finalIndex = findIthItemIndex(
          filtersCopy,
          finalIndexByAttribute + 1,
          filter => filter.attributeId === column.attribute.id
        );
        filtersCopy[finalIndex] = {...filtersCopy[finalIndex], condition, conditionValues};
      }

      stemCopy[filtersParam] = filtersCopy as any;

      stemsCopy[stemIndex] = stemCopy;

      this.store$.dispatch(new NavigationAction.SetQuery({query: {...query, stems: stemsCopy}}));
    }
  }

  private findStemIndexForFilter(
    column: TableColumn,
    queryStems: QueryStem[],
    index: number,
    findLastSuitable?: boolean
  ): {stemIndex: number; numFiltersBefore: number} {
    const table = this.stateService.findTableByColumn(column);
    // table can be merged with multiple stems so we need to find stem index which contains desired filter to change/remove/add
    let numFiltersBefore = 0;
    let stemIndex = -1;
    const filtersParam: keyof QueryStem = table.collectionId ? 'filters' : 'linkFilters';
    for (let i = 0; i < queryStems.length; i++) {
      const stem = queryStems[i];
      if (queryStemsAreSame(stem, table.stem)) {
        const filters = ((stem[filtersParam] as AttributeFilter[]) || []).filter(
          f => f.attributeId === column.attribute.id
        );
        if (index < filters.length + numFiltersBefore) {
          stemIndex = i;
          break;
        } else {
          numFiltersBefore += filters.length;
          if (findLastSuitable) {
            stemIndex = i;
          }
        }
      }
    }
    return {stemIndex, numFiltersBefore};
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

  public isRowCreating(row: TableRow): boolean {
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
        if (freshRow.documentId) {
          this.patchColumnData(freshRow, newColumn, update.value);
          deleteRows.push(freshRow.id);
        } else {
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

  public showRowDocumentDetail(row: TableRow, cell?: TableCell, resetSelection?: boolean) {
    const column = cell && this.stateService.findTableColumn(cell.tableId, cell.columnId);
    const table = this.stateService.findTable(row?.tableId);
    this.store$.dispatch(
      new WorkflowsAction.SetOpenedDocument({
        documentId: row.documentId,
        cell,
        column,
        collectionId: table?.collectionId,
        tableId: table?.id,
        nextAction: resetSelection
          ? new CommonAction.ExecuteCallback({callback: () => this.stateService.resetSelectedCell()})
          : null,
      })
    );
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

  public createNewDocument(row: TableRow, column: TableColumn, value: any) {
    if (column.attribute) {
      this.createDocument(row, column, value);
    } else {
      this.stateService.setRowValue(row, column, value);
      this.setPendingRowValue(row, column, value);

      if (!this.isColumnCreating(column)) {
        this.createAttribute(column, column.name);
      }
    }
  }

  private createDocument(row: TableRow, column: TableColumn, value: any) {
    if (this.isRowCreating(row)) {
      this.stateService.setRowValue(row, column, value);
      this.setPendingRowValue(row, column, value);
      return;
    }

    this.stateService.startRowCreatingWithValue(row, column, value);

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
          afterSuccess: document => this.onRowCreated(row, data, document.id),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    }
  }

  public createOrUpdateLink(row: TableRow, document: DocumentModel) {
    const table = this.stateService.findTable(row.tableId);

    const {linkData} = createRowData(row, table?.columns || [], this.pendingColumnValues);
    if (row.linkInstanceId) {
      this.store$.pipe(select(selectLinkInstanceById(row.linkInstanceId)), take(1)).subscribe(linkInstance => {
        const otherDocumentId = getOtherDocumentIdFromLinkInstance(linkInstance, row.documentId);
        this.store$.dispatch(
          new LinkInstancesAction.ChangeDocuments({
            linkInstanceId: row.linkInstanceId,
            documentIds: [otherDocumentId, document.id],
          })
        );
      });
    } else {
      const newRowData = {...row.data, ...this.mapDocumentData(table?.columns || [], document)};
      this.stateService.startRowCreating(row, newRowData, document.id);
      const linkInstance: LinkInstance = {
        data: linkData,
        correlationId: row.correlationId,
        linkTypeId: table.linkTypeId,
        documentIds: [document.id, row.linkedDocumentId],
      };
      this.store$.dispatch(
        new LinkInstancesAction.Create({
          linkInstance,
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    }
  }

  private mapDocumentData(columns: TableColumn[], document: DocumentModel): Record<string, any> {
    return columns.reduce((data, column) => {
      if (column.collectionId && column.attribute) {
        data[column.id] = document.data?.[column.attribute.id];
      }
      return data;
    }, {});
  }

  private onRowCreated(row: TableRow, data: Record<string, any>, documentId: string, linkInstanceId?: string) {
    const columns = this.stateService.findTableColumns(row.tableId);
    const patchData: Record<string, any> = {};
    const patchLinkData: Record<string, any> = {};
    let collectionId: string;
    let linkTypeId: string;

    const usedAttributeIds = Object.keys(data).filter(attributeId => data[attributeId]);
    for (const column of columns.filter(col => !!col.attribute)) {
      const updates = this.pendingColumnValues[column.id] || [];
      const rowUpdateIndex = updates.findIndex(update => update.row?.id === row.id);
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

    if (collectionId && Object.keys(patchData).length) {
      this.patchData({...row, documentId}, patchData, collectionId);
    } else if (linkTypeId && Object.keys(patchLinkData).length) {
      this.patchData({...row, documentId, linkInstanceId}, patchLinkData, null, linkTypeId);
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
        this.addRow(tableId, document.id)
      );
    } else if (table.linkingDocumentIds?.length) {
      if (table.linkingDocumentIds.length === 1) {
        this.addRow(tableId, table.linkingDocumentIds[0]);
      } else {
        this.modalService.showChooseLinkDocument(table.linkingDocumentIds, document =>
          this.addRow(tableId, document.id)
        );
      }
    } else {
      this.addRow(tableId);
    }
  }

  private addRow(tableId: string, linkedDocumentId?: string) {
    const table = this.stateService.findTable(tableId);
    const id = generateId();
    const newRow = {...table.newRow, linkedDocumentId, id, correlationId: id};
    this.stateService.addRow(tableId, newRow);
    this.addLockedRow(tableId, id);
  }

  private addLockedRow(tableId: string, rowId: string) {
    if (!this.lockedRowIds[tableId]) {
      this.lockedRowIds[tableId] = [];
    }
    this.lockedRowIds[tableId].push(rowId);
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
      if (row.documentId) {
        if (column.collectionId) {
          this.copyValueService.copyDocumentValue(row.documentId, column.collectionId, column.attribute.id);
        } else if (column.linkTypeId) {
          this.copyValueService.copyLinkValue(row.linkInstanceId, column.linkTypeId, column.attribute.id);
        }
      } else {
        const value = row.data?.[column.id];
        this.copyValueService.copy(value);
      }
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
            this.stateService.setSelectedCellWithDelay(cell);
          }
        }
      });
  }

  private resetLockedRows(tableIds?: string[]) {
    if (tableIds?.length) {
      tableIds?.forEach(tableId => delete this.lockedRowIds[tableId]);
    } else {
      this.lockedRowIds = {};
    }
  }
}
