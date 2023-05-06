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
import {TableRow, TableRowCellsMap} from '../../../../../../shared/table/model/table-row';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../../core/store/link-instances/link-instances.action';
import {distinctUntilChanged, map, mergeMap, skip, take} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions, ResourcesPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query, QueryStem} from '../../../../../../core/store/navigation/query/query';
import {View} from '../../../../../../core/store/views/view';
import {
  TABLE_BOTTOM_TOOLBAR_HEIGHT,
  TABLE_COLUMN_WIDTH,
  TABLE_ROW_HEIGHT,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {findAttribute, getDefaultAttributeId} from '../../../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../../../shared/settings/settings.util';
import {HeaderMenuId, WorkflowTablesMenuService} from './workflow-tables-menu.service';
import {WorkflowTablesStateService} from './workflow-tables-state.service';
import {ViewSettingsAction} from '../../../../../../core/store/view-settings/view-settings.action';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {viewSettingsChanged, viewSettingsSortChanged} from '../../../../../../core/store/views/view.utils';
import {
  WorkflowColumnSettings,
  WorkflowConfig,
  WorkflowStemConfig,
  WorkflowTableConfig,
} from '../../../../../../core/store/workflows/workflow';
import {SelectItemWithConstraintFormatter} from '../../../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {
  AggregatedArrayData,
  AggregatedDataItem,
  DataAggregator,
  DataAggregatorAttribute,
  mergeDataResourcesChains,
} from '../../../../../../shared/utils/data/data-aggregator';
import {
  findAttributeByQueryAttribute,
  QueryAttribute,
  queryAttributePermissions,
} from '../../../../../../core/model/query-attribute';
import {WorkflowTable} from '../../../model/workflow-table';
import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {
  areFiltersEqual,
  filterQueryByStem,
  queryStemsAreSame,
} from '../../../../../../core/store/navigation/query/query.util';
import {
  deepObjectsEquals,
  findIthItemIndex,
  isArray,
  isNotNullOrUndefined,
  objectsByIdMap,
} from '../../../../../../shared/utils/common.utils';
import {groupTableColumns, numberOfOtherColumnsBefore} from '../../../../../../shared/table/model/table-utils';
import {selectWorkflowSelectedDocumentId} from '../../../../../../core/store/workflows/workflow.state';
import {WorkflowsAction} from '../../../../../../core/store/workflows/workflows.action';
import {
  generateDocumentDataByResourceQuery,
  getDocumentsAndLinksByStemData,
} from '../../../../../../core/store/documents/document.utils';
import {
  addRowByParentId,
  computeTableHeight,
  createAggregatorAttributes,
  createEmptyNewRow,
  createLinkingCollectionId,
  createLinkTypeData,
  createPendingColumnValuesByRow,
  createRowData,
  createRowObjectsFromAggregated,
  createTableRowCellsMapForAttribute,
  createTableRowCellsMapForResource,
  createWorkflowTableFooter,
  getColumnMergedFilters,
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
import {
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
import {dataResourcePermissions} from '../../../../../../shared/utils/permission.utils';
import {WorkflowPerspectiveConfiguration} from '../../../../perspective-configuration';
import {Workspace} from '../../../../../../core/store/navigation/workspace';
import {DEFAULT_PERSPECTIVE_ID} from '../../../../perspective';
import {viewSettingsIdByView} from '../../../../../../core/store/view-settings/view-settings.util';
import {generateAttributeName} from '../../../../../../shared/utils/attribute.utils';
import {CreateDataResourceService} from '../../../../../../core/service/create-data-resource.service';
import {Translation} from '../../../../../../shared/utils/translation';
import {shadeColor} from '../../../../../../shared/utils/html-modifier';
import {DataAggregationType} from '../../../../../../shared/utils/data/data-aggregation';
import {sortAndFilterTableRowsByHierarchy} from '../../../../../../shared/table/model/table-hierarchy';
import {
  AttributeSortType,
  ResourceAttributeSettings,
  ViewSettings,
} from '../../../../../../core/store/view-settings/view-settings';
import {DataResourcesChain} from '../../../../../../shared/modal/data-resource-detail/model/data-resources-chain';

@Injectable()
export class WorkflowTablesDataService {
  private readonly dataAggregator: DataAggregator;

  private pendingColumnValues: Record<string, PendingRowUpdate[]> = {}; // grouped by columnId
  private lockedRowIds: Record<string, string[]> = {}; // grouped by tableId
  private currentView: View;
  private workflowId: string;

  constructor(
    private store$: Store<AppState>,
    private menuService: WorkflowTablesMenuService,
    private stateService: WorkflowTablesStateService,
    private modalService: ModalService,
    private createDataResourceService: CreateDataResourceService,
    private constraintItemsFormatter: SelectItemWithConstraintFormatter,
    private copyValueService: CopyValueService
  ) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatWorkflowValue(value, constraint, data, aggregatorAttribute)
    );
    this.stateService.selectedCell$
      .pipe(
        skip(1),
        distinctUntilChanged((a, b) => deepObjectsEquals(a, b))
      )
      .subscribe(cell => {
        const column = cell && this.stateService.findTableColumn(cell.tableId, cell.columnId);
        this.store$.dispatch(new WorkflowsAction.SetSelectedCell({workflowId: this.workflowId, cell, column}));
      });
  }

  public get editableFilters(): boolean {
    return this.stateService.perspectiveConfiguration?.editableFilters;
  }

  public get showHiddenColumns(): boolean {
    return this.stateService.perspectiveConfiguration?.showHiddenColumns;
  }

  public setWorkflowId(id: string) {
    this.workflowId = id;
  }

  public setCurrentView(view: View) {
    this.currentView = view;
  }

  private get perspectiveId(): string {
    return this.currentView?.code || DEFAULT_PERSPECTIVE_ID;
  }

  private get settingsId(): string {
    return viewSettingsIdByView(this.currentView);
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
        viewSettingsSortChanged(this.stateService.viewSettings, viewSettings),
        this.stateService.perspectiveConfiguration
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
    resetLockedRows?: boolean,
    perspectiveConfiguration?: WorkflowPerspectiveConfiguration
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
      canManageConfig,
      perspectiveConfiguration
    );
    this.createDataResourceService.setData(data, query, collections, linkTypes, constraintData);

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

        const queryByStem = filterQueryByStem(query, stemConfig.stem);
        const {documents: stemDocuments, linkInstances: stemLinkInstances} = getDocumentsAndLinksByStemData(
          data,
          queryByStem
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
        const collectionVisibleColumns = collectionColumns.filter(column => !column.hidden);

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
        const linkVisibleColumns = linkColumns.filter(column => !column.hidden);

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
        const stemTableSettings = config.tables?.filter(
          tab => queryStemsAreSame(tab.stem, stemConfig.stem) && tab.collectionId === collection.id
        );
        const isGroupedByCollection =
          attribute && isWorkflowStemConfigGroupedByResourceType(stemConfig, AttributesResourceType.Collection);
        const isGroupedByLink =
          attribute && isWorkflowStemConfigGroupedByResourceType(stemConfig, AttributesResourceType.LinkType);
        const linkingCollectionId = createLinkingCollectionId(stemConfig, collections, linkTypesMap);
        const newRowCellsMap = this.createNewRowCellsMap(
          collection,
          linkType,
          collectionColumns,
          linkColumns,
          query,
          constraintData
        );

        const tables = [];
        if (aggregatedData.items.length) {
          for (const aggregatedDataItem of aggregatedData.items) {
            const title = aggregatedDataItem.value?.toString() || '';
            const tableId = workflowTableId(stemConfig.stem, this.workflowId, title);
            const titleDataValue = constraint.createDataValue(title, constraintData);
            const titleDataResources = aggregatedDataItem.dataResources;
            const children = (aggregatedDataItem.children || []).length
              ? aggregatedDataItem.children
              : [{dataResources: [], dataResourcesChains: []}];
            for (const childItem of children) {
              const currentTable = currentTables.find(table => table.id === tableId) || tableByCollection;
              const tableSettings = stemTableSettings?.find(tab => tab.value === title);
              const {rows, newRow} = this.createRows(
                tableId,
                tableSettings,
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
                linkVisibleColumns,
                collectionVisibleColumns,
                linkPermissions,
                collectionPermissions,
                linkType,
                collection,
                constraintData
              );

              const newRowCellsMapAggregated = {
                ...newRowCellsMap,
                ...(isGroupedByCollection
                  ? createTableRowCellsMapForAttribute(attribute, title, collectionColumns)
                  : {}),
                ...(isGroupedByLink ? createTableRowCellsMapForAttribute(attribute, title, linkColumns) : {}),
              };

              const dataResourcesChains = mergeDataResourcesChains(
                aggregatedDataItem.dataResourcesChains,
                childItem.dataResourcesChains
              );
              const minHeight = computeTableHeight(rows, newRow, 1);
              const maxHeight = computeTableHeight(rows, newRow);
              const height = tableSettings?.height || computeTableHeight(rows, newRow, 5);
              const actionTitle = Translation.tableNewRowTitle(collection.purpose?.type);
              const workflowTable: WorkflowTable = {
                id: tableId,
                columns: columns.map(column => ({...column, tableId})),
                rows,
                visibleRows: sortAndFilterTableRowsByHierarchy(rows),
                collectionId: collection.id,
                linkTypeId: linkType?.id,
                color: shadeColor(collection.color, 0.5),
                title: attribute && {
                  value: title,
                  dataValue: titleDataValue,
                  constraint,
                  dataResources: titleDataResources,
                },
                stem: stemConfig.stem,
                query: queryByStem,
                minHeight,
                height,
                bottomToolbar: !!newRow || shouldShowToolbarWithoutNewRow(height, minHeight, maxHeight),
                width: columnsWidth + 1, // + 1 for border
                newRow: newRow ? {...newRow, tableId, cellsMap: newRowCellsMapAggregated, actionTitle} : undefined,
                linkingCollectionId,
                footer: createWorkflowTableFooter(rows, columns, stemConfig, config.footers, constraintData),
                dataResourcesChains,
              };
              tables.push(workflowTable);
            }
          }
        } else {
          const tableId = workflowTableId(stemConfig.stem, this.workflowId);
          const tableSettings = stemTableSettings?.find(tab => !tab.value);

          const {rows, newRow} = this.createRows(
            tableId,
            tableSettings,
            tableByCollection?.rows || [],
            [],
            linkVisibleColumns,
            collectionVisibleColumns,
            linkPermissions,
            collectionPermissions,
            linkType,
            collection,
            constraintData
          );

          const minHeight = computeTableHeight(rows, newRow, 1);
          const maxHeight = computeTableHeight(rows, newRow);
          const height = tableSettings?.height || maxHeight;
          const actionTitle = Translation.tableNewRowTitle(collection.purpose?.type);
          const workflowTable: WorkflowTable = {
            id: tableId,
            columns: columns.map(column => ({...column, tableId})),
            rows,
            visibleRows: sortAndFilterTableRowsByHierarchy(rows),
            collectionId: collection.id,
            linkTypeId: linkType?.id,
            color: shadeColor(collection.color, 0.5),
            stem: stemConfig.stem,
            query: queryByStem,
            minHeight,
            height,
            width: columnsWidth + 1, // + 1 for border
            newRow: newRow ? {...newRow, tableId, cellsMap: newRowCellsMap, actionTitle} : undefined,
            bottomToolbar: !!newRow || shouldShowToolbarWithoutNewRow(height, minHeight, maxHeight),
            footer: createWorkflowTableFooter(rows, columns, stemConfig, config.footers, constraintData),
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

  private createNewRowCellsMap(
    collection: Collection,
    linkType: LinkType,
    collectionsColumns: TableColumn[],
    linkColumns: TableColumn[],
    query: Query,
    constraintData: ConstraintData
  ): TableRowCellsMap {
    const documentData = generateDocumentDataByResourceQuery(collection, query, constraintData);
    const linkData = linkType ? generateDocumentDataByResourceQuery(linkType, query, constraintData) : {};

    return {
      ...createTableRowCellsMapForResource(
        {id: null, data: documentData},
        collectionsColumns,
        collection,
        constraintData
      ),
      ...createTableRowCellsMapForResource({id: null, data: linkData}, linkColumns, linkType, constraintData),
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

    const originalColor = isCollection ? (<Collection>resource).color : null;
    const color = columnBackgroundColor(originalColor);
    const newColumnColor = columnBackgroundColor(originalColor, true);
    const attributeColumns = createAttributesSettingsOrder(resource.attributes, attributeSettings).reduce<
      TableColumn[]
    >((columns, setting) => {
      const attribute = findAttribute(resource.attributes, setting.attributeId);
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
        editableFilters: this.editableFilters,
        width: columnSettings?.width || TABLE_COLUMN_WIDTH,
        collectionId: isCollection ? resource.id : null,
        linkTypeId: isCollection ? null : resource.id,
        color,
        filters: this.createColumnFilters(attribute, query, resource.id, resourceType),
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

      if (!column.hidden || (this.showHiddenColumns && permissions?.roles?.Read)) {
        columns.push(this.checkColumnMenuItems(column));
      }

      return columns;
    }, []);

    const syncActions = [];
    for (let i = 0; i < currentColumns?.length; i++) {
      const column = {...currentColumns[i], color: newColumnColor};
      if (!column.attribute) {
        const mappedColumn = mappedUncreatedColumns[column.id];
        if (permissions?.roles?.AttributeEdit || mappedColumn) {
          attributeColumns.splice(i, 0, mappedColumn || column);
          if (mappedColumn) {
            this.stateService.addColumn(mappedColumn, i);
            syncActions.push(
              new ViewSettingsAction.AddAttribute({
                settingsId: this.settingsId,
                attributeId: mappedColumn.attribute.id,
                position: i,
                collection: isCollection && resource,
                linkType: !isCollection && <LinkType>resource,
              })
            );
          }
        }
      }
    }

    if (
      (!this.currentView || attributeColumns.length === 0) &&
      isCollection &&
      permissions.roles?.AttributeEdit &&
      !attributeColumns.some(column => !column.attribute)
    ) {
      const lastColumn: TableColumn = {
        id: generateId(),
        name: '',
        collectionId: isCollection ? resource.id : null,
        linkTypeId: isCollection ? null : resource.id,
        editableFilters: this.editableFilters,
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

  private checkColumnMenuItems(column: TableColumn): TableColumn {
    if (!this.showHiddenColumns) {
      const hideMenuItem = column.menuItems.find(item => item.id === HeaderMenuId.Hide);
      if (hideMenuItem) {
        hideMenuItem.disabled = true;
      }
    }
    return column;
  }

  private createColumnFilters(
    attribute: Attribute,
    query: Query,
    resourceId: string,
    resourceType: AttributesResourceType
  ): ColumnFilter[] {
    const attributeFilters = getColumnMergedFilters(attribute, query, resourceId, resourceType);
    if (this.stateService.canManageConfig || !this.currentView) {
      return attributeFilters.map(filter => ({...filter, deletable: true}));
    }

    const currentViewSameStems =
      this.currentView?.query?.stems?.filter(s => queryStemsAreSame(s, query.stems[0])) || [];
    const currentViewFilters = getColumnMergedFilters(
      attribute,
      {stems: currentViewSameStems},
      resourceId,
      resourceType
    );
    return attributeFilters.map((filter, index) => {
      const sameFiltersBefore = attributeFilters.slice(0, index).filter(f => areFiltersEqual(f, filter)).length;
      const sameStemFilters = currentViewFilters.filter(f => areFiltersEqual(f, filter)).length;
      const deletable = sameFiltersBefore >= sameStemFilters;

      return {...filter, deletable};
    });
  }

  public createEmptyLinkColumn(table: WorkflowTable): TableColumn {
    const config = this.findStemConfigByTable(table);
    const {linkType, permissions} = createLinkTypeData(
      config,
      this.stateService.collections,
      this.stateService.permissions,
      this.stateService.linkTypesMap
    );
    if (linkType && permissions?.roles?.AttributeEdit) {
      const lastColumn: TableColumn = {
        id: generateId(),
        name: '',
        linkTypeId: linkType.id,
        editableFilters: this.editableFilters,
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

  private findStemConfigByTable(table: WorkflowTable): WorkflowStemConfig {
    return (
      table && this.stateService.config.stemsConfigs.find(stemConfig => queryStemsAreSame(stemConfig.stem, table.stem))
    );
  }

  private createRows(
    tableId: string,
    config: WorkflowTableConfig,
    currentRows: TableRow[],
    sortedData: {document: DocumentModel; linkInstance?: LinkInstance}[],
    linkColumns: TableColumn[],
    collectionColumns: TableColumn[],
    linkPermissions: AllowedPermissions,
    collectionPermissions: AllowedPermissions,
    linkType: LinkType,
    collection: Collection,
    constraintData: ConstraintData
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
    const canCreateNewRow = linkPermissions
      ? linkPermissions.rolesWithView?.DataContribute
      : collectionPermissions.rolesWithView?.DataContribute;

    const {rows, lockedRows} = sortedData.reduce(
      (data, object, index) => {
        const objectId = object.linkInstance?.id || object.document.id;
        const objectCorrelationId = object.linkInstance?.correlationId || object.document.correlationId;
        const parentDocumentId = object.document?.metaData?.parentId;
        const parentRow: TableRow = data.rowsByDocumentIdMap[parentDocumentId];
        const currentRow = rowsMap[objectCorrelationId || objectId] || rowsMap[objectId];
        const pendingData = (currentRow && pendingColumnValuesByRow[currentRow.id]) || {};
        const documentCells = createTableRowCellsMapForResource(
          object.document,
          collectionColumns,
          collection,
          constraintData,
          pendingData
        );
        const linkCells = createTableRowCellsMapForResource(
          object.linkInstance,
          linkColumns,
          linkType,
          constraintData,
          pendingData
        );
        const id = currentRow?.id || objectCorrelationId || generateId();
        const documentPermissions = dataResourcePermissions(
          object.document,
          collection,
          collectionPermissions,
          constraintData.currentUser,
          constraintData
        );
        const linkInstancePermissions = dataResourcePermissions(
          object.linkInstance,
          linkType,
          linkPermissions,
          constraintData.currentUser,
          constraintData
        );

        const hierarchyLevel = isNotNullOrUndefined(parentRow?.level) ? parentRow.level + 1 : 0;

        const row: TableRow = {
          id,
          tableId,
          cellsMap: {...documentCells, ...linkCells},
          documentId: object.document.id,
          linkInstanceId: object.linkInstance?.id,
          parentRowId: parentRow?.id,
          level: hierarchyLevel,
          height: currentRow?.height || TABLE_ROW_HEIGHT,
          expanded: config?.expandedDocuments?.includes(object.document.id),
          correlationId: objectCorrelationId || id,
          commentsCount: object.document ? object.document.commentsCount : object.linkInstance.commentsCount,
          documentEditable: documentPermissions?.edit,
          linkEditable: !!linkType && linkInstancePermissions?.edit,
          suggestLinks: !!linkType && linkInstancePermissions?.edit,
          suggestDetail: !linkType,
          documentMenuItems: [],
          linkMenuItems: [],
        };
        data.rowsByDocumentIdMap[object.document.id] = row;

        row.documentMenuItems.push(
          ...this.menuService.createRowMenu(
            documentPermissions,
            row,
            {canCreateNewRow, previousRow: data.previousRow, purpose: collection.purpose?.type},
            !!object.linkInstance
          )
        );
        row.linkMenuItems.push(
          ...this.menuService.createRowMenu(
            linkInstancePermissions,
            row,
            {canCreateNewRow, previousRow: data.previousRow, purpose: collection.purpose?.type},
            !!object.linkInstance
          )
        );

        if (lockedRowIds.includes(row.id)) {
          data.lockedRows.push(row);
        } else {
          data.rows.push(row);
        }

        data.previousRow = row;

        return data;
      },
      {rows: [], lockedRows: [], rowsByDocumentIdMap: {}, previousRow: undefined}
    );

    let newRow: TableRow;
    if (canCreateNewRow) {
      newRow = createEmptyNewRow(tableId, !!linkType);
      newRow.documentMenuItems = this.menuService.createRowMenu({read: false, edit: true, delete: true}, newRow);
      newRow.linkMenuItems = this.menuService.createRowMenu({read: false, edit: true, delete: true}, newRow);
    }

    const lockedRowsMap = objectsByIdMap(lockedRows);

    const lockedRowsWithUncreated = lockedRowIds
      .map(rowId => lockedRowsMap[rowId] || rowsMap[rowId])
      .filter(row => !!row)
      .reduce((allRows, row) => addRowByParentId(row, allRows), rows);

    return {rows: lockedRowsWithUncreated, newRow};
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
          settingsId: this.settingsId,
          from: fromWithoutOther,
          to: toWithoutOther,
          collection,
          linkType,
        })
      );
    }
  }

  public resizeTable(table: WorkflowTable, height: number) {
    this.store$.dispatch(
      new WorkflowsAction.SetTableHeight({
        workflowId: this.perspectiveId,
        collectionId: table.collectionId,
        stem: table.stem,
        value: table.title?.value || '',
        height,
      })
    );
  }

  public changeSort(column: TableColumn, sort: AttributeSortType) {
    const {collection, linkType} = this.stateService.findColumnResourcesByColumn(column);
    this.store$.dispatch(
      new ViewSettingsAction.SetAttribute({
        settingsId: this.settingsId,
        attributeId: column.attribute.id,
        settings: {sort},
        collection,
        linkType,
      })
    );
  }

  public setColumnAggregation(column: TableColumn, aggregation: DataAggregationType) {
    const table = this.stateService.findTableByColumn(column);
    if (column.attribute) {
      this.store$.dispatch(
        new WorkflowsAction.SetFooterAttributeConfig({
          workflowId: this.perspectiveId,
          attributeId: column.attribute.id,
          resourceType: column.collectionId ? AttributesResourceType.Collection : AttributesResourceType.LinkType,
          stem: table.stem,
          config: {aggregation},
        })
      );
    }
  }

  public removeFilter(column: TableColumn, index: number) {
    const table = this.stateService.findTableByColumn(column);
    const query = this.stateService.query;
    const stemsCopy = [...(query.stems || [])];
    const filtersParam: keyof QueryStem = table.collectionId ? 'filters' : 'linkFilters';
    const currentFilter = column.filters[index];
    const numSameFilters =
      (column.filters || []).slice(0, index).filter(filter => areFiltersEqual(filter, currentFilter)).length + 1;

    for (let i = 0; i < stemsCopy.length; i++) {
      if (!queryStemsAreSame(stemsCopy[i], table.stem)) {
        continue;
      }

      const stemCopy = {...stemsCopy[i]};
      const filtersCopy = [...stemCopy[filtersParam]];
      const finalIndex = findIthItemIndex(filtersCopy, numSameFilters, filter =>
        areFiltersEqual(currentFilter, filter)
      );
      if (finalIndex >= 0) {
        filtersCopy.splice(finalIndex, 1);
        stemCopy[filtersParam] = filtersCopy as any;
        stemsCopy[i] = stemCopy;
      }
    }

    this.store$.dispatch(new NavigationAction.SetQuery({query: {...query, stems: stemsCopy}}));
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
    const filtersParam: keyof QueryStem = table.collectionId ? 'filters' : 'linkFilters';

    const currentFilter = column.filters[index];
    const numSameFilters = isNew
      ? 0
      : (column.filters || []).slice(0, index).filter(filter => areFiltersEqual(filter, currentFilter)).length + 1;

    for (let i = 0; i < stemsCopy.length; i++) {
      if (!queryStemsAreSame(stemsCopy[i], table.stem)) {
        continue;
      }

      const stemCopy = {...stemsCopy[i]};
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
        const finalIndex = findIthItemIndex(filtersCopy, numSameFilters, filter =>
          areFiltersEqual(currentFilter, filter)
        );
        filtersCopy[finalIndex] = {...filtersCopy[finalIndex], condition, conditionValues};
      }
      stemCopy[filtersParam] = filtersCopy as any;
      stemsCopy[i] = stemCopy;
    }

    this.store$.dispatch(new NavigationAction.SetQuery({query: {...query, stems: stemsCopy}}));
  }

  public hideColumn(column: TableColumn) {
    const {collection, linkType} = this.stateService.findColumnResourcesByColumn(column);
    this.store$.dispatch(
      new ViewSettingsAction.HideAttributes({
        settingsId: this.settingsId,
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
        settingsId: this.settingsId,
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
      this.store$.dispatch(
        new WorkflowsAction.SetColumnWidth({
          workflowId: this.perspectiveId,
          width,
          attributeId: column.attribute.id,
          collectionId: column.collectionId,
          linkTypeId: column.linkTypeId,
        })
      );
    } else {
      this.stateService.resizeColumn(changedTable, column, width);
    }
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
      this.store$.dispatch(
        new LinkInstancesAction.DeleteConfirm({linkInstanceId: row.linkInstanceId, workspace: this.currentWorkspace()})
      );
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
          workspace: this.currentWorkspace(),
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
        workflowId: this.workflowId,
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

  public indentRow(row: TableRow) {
    if (!row?.documentEditable) {
      return;
    }

    const table = this.stateService.findTable(row?.tableId);
    const rows = table?.rows || [];
    const rowIndex = rows.findIndex(tr => tr.id === row.id);
    if (rowIndex <= 0) {
      return;
    }

    const parentRow = rows
      .slice(0, rowIndex)
      .reverse()
      .find(hierarchyRow => (hierarchyRow?.level || 0) === (row?.level || 0));

    if (parentRow) {
      if (!parentRow.expanded) {
        this.toggleHierarchy(parentRow);
      }

      this.store$.dispatch(
        new DocumentsAction.PatchMetaData({
          collectionId: table.collectionId,
          documentId: row.documentId,
          metaData: {parentId: parentRow?.documentId},
          workspace: this.currentWorkspace(),
        })
      );
    }
  }

  public outdentRow(row: TableRow) {
    if (!row?.documentEditable) {
      return;
    }

    const table = this.stateService.findTable(row?.tableId);
    const rows = table?.rows || [];
    const rowIndex = rows.findIndex(tr => tr.id === row.id);
    if (rowIndex <= 0) {
      return;
    }

    const parentRow = rows
      .slice(0, rowIndex)
      .reverse()
      .find(hierarchyRow => (hierarchyRow?.level || 0) === (row?.level || 0) - 1);

    const previousParentDocument = this.stateService.data?.uniqueDocuments?.find(
      document => document.id === parentRow?.documentId
    );
    const parentDocumentId = previousParentDocument?.metaData?.parentId || null;

    if (parentRow) {
      if (!parentRow.expanded) {
        this.toggleHierarchy(parentRow);
      }

      this.store$.dispatch(
        new DocumentsAction.PatchMetaData({
          collectionId: table.collectionId,
          documentId: row.documentId,
          metaData: {parentId: parentDocumentId},
          workspace: this.currentWorkspace(),
        })
      );
    }
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

  public showAttributeLock(column: TableColumn) {
    this.stateService.resetSelectedCell();
    this.modalService.showAttributeLock(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public showAttributeFormatting(column: TableColumn) {
    this.stateService.resetSelectedCell();
    this.modalService.showAttributeConditionalFormatting(column.attribute.id, column.collectionId, column.linkTypeId);
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
        this.createAttribute(column, this.getColumnName(column));
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
        this.createAttribute(column, this.getColumnName(column));
      }
    }
  }

  private getColumnName(column: TableColumn): string {
    if (column.name) {
      return column.name;
    }

    const columnNames = this.stateService
      .columns(column.tableId)
      .map(column => column.attribute?.name || column.name)
      .filter(name => !!name);
    return generateAttributeName(columnNames);
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
    const parentRow = row.parentRowId && table?.rows.find(r => r.id === row.parentRowId);
    const document: DocumentModel = {
      correlationId: row.id,
      collectionId: table.collectionId,
      data,
      metaData: {parentId: parentRow?.documentId},
    };

    if (row.linkedChain) {
      const documentIndex = row.linkedChain.index;
      const linkIndex = documentIndex - 1;
      const linkInstance: LinkInstance = {
        ...row.linkedChain.linkInstances[linkIndex],
        data: linkData,
        correlationId: row.correlationId,
      };
      row.linkedChain.documents[documentIndex] = document;
      row.linkedChain.linkInstances[linkIndex] = linkInstance;
      this.store$.dispatch(
        new DocumentsAction.CreateChain({
          ...row.linkedChain,
          workspace: this.currentWorkspace(),
          afterSuccess: ({documents, linkInstances}) =>
            this.onRowCreated(
              row,
              data,
              documents[documents.length - 1].id,
              linkInstances[linkInstances.length - 1].id
            ),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    } else {
      this.store$.dispatch(
        new DocumentsAction.Create({
          document,
          workspace: this.currentWorkspace(),
          afterSuccess: document => this.onRowCreated(row, data, document.id),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    }
  }

  private currentWorkspace(): Workspace {
    return {viewId: this.currentView?.id};
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
            workspace: this.currentWorkspace(),
            documentIds: [otherDocumentId, document.id],
          })
        );
      });
    } else {
      const documentCellsMap = createTableRowCellsMapForResource(
        document,
        table?.columns,
        this.stateService.collectionsMap[table.collectionId],
        this.stateService.constraintData
      );
      const newRowCellsMap: TableRowCellsMap = {...row.cellsMap, ...documentCellsMap};
      this.stateService.startRowCreating(row, newRowCellsMap, document.id);

      const documentIndex = row.linkedChain.index;
      const linkIndex = documentIndex - 1;
      const linkInstance: LinkInstance = {
        ...row.linkedChain.linkInstances[linkIndex],
        data: linkData,
        correlationId: row.correlationId,
        documentIds: [document.id, row.linkedChain.documents[documentIndex - 1].id],
      };
      row.linkedChain.documents[documentIndex] = document;
      row.linkedChain.linkInstances[linkIndex] = linkInstance;
      this.store$.dispatch(
        new DocumentsAction.CreateChain({
          ...row.linkedChain,
          workspace: this.currentWorkspace(),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    }
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
      this.store$.dispatch(new DocumentsAction.PatchData({document, workspace: this.currentWorkspace()}));
    } else if (linkTypeId && row.linkInstanceId) {
      const linkInstance: LinkInstance = {id: row.linkInstanceId, linkTypeId, data, documentIds: ['', '']};
      this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance, workspace: this.currentWorkspace()}));
    }
  }

  public copyTableColumn(table: TableModel, column: TableColumn): TableColumn {
    const copiedColumn = {
      ...column,
      id: generateId(),
      attribute: undefined,
      creating: undefined,
      default: false,
      hidden: false,
      name: '',
      menuItems: [],
    };
    const permissions = this.stateService.getColumnPermissions(column);
    copiedColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, copiedColumn, true));
    return copiedColumn;
  }

  public toggleHierarchy(row: TableRow) {
    this.stateService.setRowProperty(row, 'expanded', !row.expanded);

    const table = this.stateService.findTable(row.tableId);
    this.store$.dispatch(
      new WorkflowsAction.ToggleHierarchy({
        workflowId: this.workflowId,
        documentId: row.documentId,
        collectionId: table.collectionId,
        stem: table.stem,
        value: table.title?.value || '',
      })
    );
  }

  public resetSidebar() {
    this.store$.dispatch(new WorkflowsAction.ResetOpenedDocument({workflowId: this.workflowId}));
  }

  public createNewRow(tableId: string, parentRowId?: string) {
    const table = this.stateService.findTable(tableId);
    if (table.linkingCollectionId) {
      const config = this.findStemConfigByTable(table);
      const groupingAttributes = config.attribute
        ? [{attribute: config.attribute, value: table.title?.dataValue?.serialize()}]
        : [
            {
              attribute: {
                resourceIndex: 0,
                resourceId: table.stem.collectionId,
                resourceType: AttributesResourceType.Collection,
                attributeId: undefined,
              },
              value: undefined,
            },
          ];
      this.createDataResourceService.chooseDataResourcesChain(
        table.stem,
        table.query,
        config.collection,
        groupingAttributes,
        table.dataResourcesChains,
        this.currentView?.id,
        chain => this.addRow(tableId, parentRowId, chain)
      );
    } else {
      this.addRow(tableId, parentRowId);
    }
  }

  private addRow(tableId: string, parentRowId: string, linkedChain?: DataResourcesChain) {
    const table = this.stateService.findTable(tableId);
    const id = generateId();
    const newRow: TableRow = {
      ...table.newRow,
      linkedChain,
      id,
      correlationId: id,
      parentRowId,
      suggestLinks: !!linkedChain,
      suggestDetail: !linkedChain,
    };

    const parentRow = parentRowId && table.rows.find(row => row.id === parentRowId);
    if (parentRow && !parentRow.expanded) {
      this.toggleHierarchy(parentRow);
    }

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
      select(selectWorkflowSelectedDocumentId(this.workflowId)),
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
      constraint.createDataValue(row.cellsMap?.[column.id]?.data, this.stateService.constraintData)
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
        const value = row.cellsMap?.[column.id]?.data;
        this.copyValueService.copy(value);
      }
    }
  }

  private checkInitialSelection(tables: WorkflowTable[]) {
    this.store$.pipe(select(selectViewCursor), take(1)).subscribe(cursor => {
      const cell = viewCursorToWorkflowCell(cursor, tables);
      if (cell) {
        this.stateService.performInitialSelection(cell);
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

function shouldShowToolbarWithoutNewRow(height: number, minHeight: number, maxHeight: number): boolean {
  return height < maxHeight && height > minHeight + TABLE_BOTTOM_TOOLBAR_HEIGHT;
}
