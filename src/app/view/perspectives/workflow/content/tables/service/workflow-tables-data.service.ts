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
import {take} from 'rxjs/operators';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {AttributeSortType, ResourceAttributeSettings, ViewSettings} from '../../../../../../core/store/views/view';
import {TABLE_COLUMN_WIDTH, TABLE_ROW_HEIGHT, TableModel} from '../../../../../../shared/table/model/table-model';
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
import {
  queryStemAttributesResourcesOrder,
  queryStemsAreSame,
} from '../../../../../../core/store/navigation/query/query.util';
import {objectsByIdMap} from '../../../../../../shared/utils/common.utils';
import {numberOfDiffColumnsBefore} from '../../../../../../shared/table/model/table-utils';
import {selectWorkflowId} from '../../../../../../core/store/workflows/workflow.state';
import {WorkflowsAction} from '../../../../../../core/store/workflows/workflows.action';
import {sortDataResourcesByViewSettings} from '../../../../../../shared/utils/data-resource.utils';

interface PendingRowUpdate {
  row: TableRow;
  value: any;
}

@Injectable()
export class WorkflowTablesDataService {
  private pendingColumnValues: Record<string, PendingRowUpdate[]> = {};
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
          query
        );

        // creating link columns
        const currentLinkColumns = (tableByCollection?.columns || []).filter(column => column.linkTypeId);
        const {
          columns: linkColumns,
          actions: linkActions,
          linkType,
          permissions: linkPermissions,
        } = this.createLinkTypeColumns(
          config,
          stemConfig,
          currentLinkColumns,
          collections,
          permissions,
          linkTypesMap,
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
        const stemTableSettings = config.tables?.filter(
          tab => queryStemsAreSame(tab.stem, stemConfig.stem) && tab.collectionId === collection.id
        );
        for (const aggregatedDataItem of aggregatedData.items) {
          const title = aggregatedDataItem.value || '';
          const tableId = collection.id + title;
          const titleDataValue = constraint.createDataValue(title, constraintData);
          const titleDataResources = aggregatedDataItem.dataResources;
          for (const childItem of aggregatedDataItem.children || []) {
            const currentTable = currentTables.find(table => table.id === tableId) || tableByCollection;
            const rows = this.createRows(
              tableId,
              currentTable?.rows || [],
              createRowDataFromAggregated(childItem, collectionsMap, linkInstancesMap, viewSettings, constraintData),
              linkColumns,
              collectionColumns,
              linkPermissions,
              collectionPermissions
            );

            const tableSettings = stemTableSettings?.find(tab => tab.value === title);
            const heightFn = (numberOfRows: number) => (numberOfRows + 1) * TABLE_ROW_HEIGHT + 16;
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
    query: Query
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
        config.columns?.collections?.[collection.id] || []
      ),
      permissions: collectionPermissions,
    };
  }

  private createLinkTypeColumns(
    config: WorkflowConfig,
    stemConfig: WorkflowStemConfig,
    currentColumns: TableColumn[],
    collections: Collection[],
    permissions: Record<string, AllowedPermissions>,
    linkTypesMap: Record<string, LinkType>,
    viewSettings: ViewSettings,
    query: Query
  ): {columns: TableColumn[]; actions: Action[]; linkType?: LinkType; permissions?: AllowedPermissions} {
    if (stemConfig.attribute && stemConfig.collection.resourceIndex !== stemConfig.attribute.resourceIndex) {
      const attributesResourcesOrder = queryStemAttributesResourcesOrder(
        stemConfig.stem,
        collections,
        Object.values(linkTypesMap)
      );
      const resourceIndex = stemConfig.collection.resourceIndex;
      const linkIndex = resourceIndex + (resourceIndex < stemConfig.attribute.resourceIndex ? 1 : -1);
      const linkType = <LinkType>attributesResourcesOrder[linkIndex];
      const linkTypeSettings = viewSettings?.attributes?.linkTypes?.[linkType.id] || [];
      const linkTypePermissions = queryAttributePermissions(
        {
          resourceId: linkType.id,
          resourceType: AttributesResourceType.LinkType,
        },
        permissions,
        linkTypesMap
      );

      return {
        ...this.createColumns(
          currentColumns,
          linkType,
          AttributesResourceType.LinkType,
          linkTypePermissions,
          query,
          linkTypeSettings,
          config.columns?.linkTypes?.[linkType.id] || []
        ),
        linkType,
        permissions: linkTypePermissions,
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
    columnsSettings: WorkflowColumnSettings[]
  ): {columns: TableColumn[]; actions: Action[]} {
    const isCollection = resourceType === AttributesResourceType.Collection;
    const defaultAttributeId = isCollection ? getDefaultAttributeId(resource) : null;
    const columnSettingsMap = columnsSettings.reduce(
      (map, setting) => ({
        ...map,
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
        column.menuItems.push(...this.menuService.createHeaderMenu(permissions, column, true));
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

  private createRows(
    tableId: string,
    currentRows: TableRow[],
    data: {document: DocumentModel; linkInstance?: LinkInstance}[],
    linkColumns: TableColumn[],
    collectionColumns: TableColumn[],
    linkPermissions: AllowedPermissions,
    collectionPermissions: AllowedPermissions
  ): TableRow[] {
    const rowsMap = currentRows.reduce((result, row) => ({...result, [row.documentId || row.correlationId]: row}), {});

    const linkColumnIdsMap = createColumnIdsMap(linkColumns);
    const columnIdsMap = createColumnIdsMap(collectionColumns);
    const pendingColumnValuesByRow = createPendingColumnValuesByRow(this.pendingColumnValues);

    const rows = data.map((object, index) => {
      const currentRow = rowsMap[object.document.correlationId || object.document.id] || rowsMap[object.document.id];
      const documentData = createRowData(object.document.data, columnIdsMap);
      const linkData = createRowData(object.linkInstance?.data, linkColumnIdsMap);
      const pendingData = (currentRow && pendingColumnValuesByRow[currentRow.id]) || {};
      const id = currentRow?.id || object.document.id;
      const row: TableRow = {
        id,
        tableId,
        data: {...documentData, ...linkData, ...pendingData},
        documentId: object.document.id,
        linkInstanceId: object.linkInstance?.id,
        height: currentRow?.height || TABLE_ROW_HEIGHT,
        correlationId: object.document.correlationId || id,
        documentMenuItems: [],
        linkMenuItems: [],
      };
      row.documentMenuItems.push(...this.menuService.createRowMenu(collectionPermissions, row, !!object.linkInstance));
      row.linkMenuItems.push(...this.menuService.createRowMenu(linkPermissions, row, !!object.linkInstance));
      return row;
    });
    // const rowsIds = new Set(rows.map(row => row.id));
    //
    // for (let i = 0; i < currentRows?.length; i++) {
    //   const row = currentRows[i];
    //   if (!row.documentId && !rowsIds.has(row.id)) {
    //     // we are adding new rows only to the end
    //     rows.push(row);
    //   }
    // }
    //
    // if (collectionPermissions.writeWithView && !rows.some(row => !row.documentId)) {
    //   const id = generateId();
    //   const newRow: TableRow = {
    //     id,
    //     tableId,
    //     data: {},
    //     correlationId: id,
    //     height: TABLE_ROW_HEIGHT,
    //     documentMenuItems: [],
    //     linkMenuItems: [],
    //   };
    //   newRow.documentMenuItems.push(...this.menuService.createRowMenu(collectionPermissions, newRow));
    //   rows.push(newRow);
    // }

    return rows;
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

  public isRowCreating(row: TableRow): boolean {
    return row.creating;
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

    this.stateService.startRowCreating(row, column, value);
    const data = {...this.createPendingRowValues(row), [column.attribute.id]: value};
    if (column.collectionId) {
      const document: DocumentModel = {
        correlationId: row.id,
        collectionId: column.collectionId,
        data,
      };
      this.store$.dispatch(
        new DocumentsAction.Create({
          document,
          afterSuccess: documentId => this.onRowCreated(row, data, documentId),
          onFailure: () => this.stateService.endRowCreating(row),
        })
      );
    } else if (column.linkTypeId) {
      // TODO create with link
    }
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
}

function createRowDataFromAggregated(
  item: AggregatedDataItem,
  collectionsMap: Record<string, Collection>,
  linkInstancesMap: Record<string, LinkInstance>,
  viewSettings: ViewSettings,
  constraintData: ConstraintData
): {document: DocumentModel; linkInstance?: LinkInstance}[] {
  const documents = <DocumentModel[]>item.dataResources || [];
  const dataResourcesChains = item.dataResourcesChains?.reduce(
    (chainMap, chain, index) => ({
      ...chainMap,
      [documents[index].id]: chain,
    }),
    {}
  );
  const sortedDocuments = sortDataResourcesByViewSettings<DocumentModel>(
    documents,
    collectionsMap,
    AttributesResourceType.Collection,
    viewSettings,
    constraintData
  );
  return sortedDocuments.reduce(
    (rowData, document) => {
      if (rowData.documentIds.has(document.id)) {
        return rowData;
      }

      const chain = dataResourcesChains?.[document.id];
      let linkInstance: LinkInstance;
      if (chain?.length > 1) {
        // documentIds and linkInstanceIds are in sequence
        const linkInstanceId = chain[chain.length - 2].linkInstanceId;
        linkInstance = linkInstancesMap[linkInstanceId];
      }

      rowData.data.push({document, linkInstance});
      rowData.documentIds.add(document.id);
      return rowData;
    },
    {data: [], documentIds: new Set()}
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
