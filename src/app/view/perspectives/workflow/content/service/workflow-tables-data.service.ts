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

import {AppState} from '../../../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {TableColumn} from '../../../../../shared/table/model/table-column';
import {CollectionsAction} from '../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {Injectable} from '@angular/core';
import {TableRow} from '../../../../../shared/table/model/table-row';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {selectCollectionById} from '../../../../../core/store/collections/collections.state';
import {map, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../../../../core/store/link-instances/link-instances.state';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query/query';
import {AttributeSortType, ResourceAttributeSettings, ViewSettings} from '../../../../../core/store/views/view';
import {TABLE_COLUMN_WIDTH, TABLE_ROW_HEIGHT, TableModel} from '../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../../shared/settings/settings.util';
import {objectKeys} from 'codelyzer/util/objectKeys';
import {WorkflowTablesMenuService} from './workflow-tables-menu.service';
import {uniqueDocuments} from '../../../../../core/store/documents/document.utils';
import {generateAttributeName} from '../../../../../shared/utils/attribute.utils';
import {WorkflowTablesStateService} from './workflow-tables-state.service';
import {ViewSettingsAction} from '../../../../../core/store/view-settings/view-settings.action';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {viewSettingsChanged} from '../../../../../core/store/views/view.utils';
import {WorkflowConfig} from '../../../../../core/store/workflows/workflow';
import {SelectItemWithConstraintFormatter} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {DataAggregator, DataAggregatorAttribute} from '../../../../../shared/utils/data/data-aggregator';
import {Constraint} from '../../../../../core/model/constraint';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {UnknownConstraint} from '../../../../../core/model/constraint/unknown.constraint';
import {
  findAttributeByQueryAttribute,
  QueryAttribute,
  queryAttributePermissions,
} from '../../../../../core/model/query-attribute';
import {WorkflowTable} from '../../model/workflow-table';
import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';
import {queryStemAttributesResourcesOrder} from '../../../../../core/store/navigation/query/query.util';
import {objectsByIdMap} from '../../../../../shared/utils/common.utils';
import {numberOfDiffColumnsBefore} from '../../../../../shared/table/model/table-utils';

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
    return config.stemsConfigs.reduce(
      (result, stemConfig) => {
        if (!stemConfig.resource) {
          return result;
        }

        const collection = collectionsMap[stemConfig.resource.resourceId];
        const collectionPermissions = queryAttributePermissions(stemConfig.resource, permissions, linkTypesMap);
        const collectionSettings = viewSettings?.attributes?.collections?.[collection.id] || [];

        const tableByCollection = currentTables.find(tab => tab.collectionId === collection.id);

        const {columns, actions} = this.createColumns(
          (tableByCollection?.columns || []).filter(column => column.collectionId),
          collection,
          AttributesResourceType.Collection,
          collectionPermissions,
          query,
          collectionSettings
        );

        if (stemConfig.attribute) {
          const attributesResourcesOrder = queryStemAttributesResourcesOrder(stemConfig.stem, collections, linkTypes);
          const resourceIndex = stemConfig.resource.resourceIndex;
          const linkIndex = resourceIndex + (resourceIndex < stemConfig.attribute.resourceIndex ? 1 : -1);
          const linkType = attributesResourcesOrder[linkIndex];
          const linkTypeSettings = viewSettings?.attributes?.linkTypes?.[linkType.id] || [];
          const linkTypePermissions = queryAttributePermissions(
            {
              resourceId: linkType.id,
              resourceType: AttributesResourceType.LinkType,
            },
            permissions,
            linkTypesMap
          );

          const {columns: linkTypeColumns, actions: linkTypeActions} = this.createColumns(
            (tableByCollection?.columns || []).filter(column => column.linkTypeId),
            linkType,
            AttributesResourceType.LinkType,
            linkTypePermissions,
            query,
            linkTypeSettings
          );
          columns.splice(0, 0, ...linkTypeColumns);
          actions.push(...linkTypeActions);
        }

        this.dataAggregator.updateData(
          collections,
          documents,
          linkTypes,
          linkInstances,
          stemConfig.stem,
          constraintData
        );

        const aggregatorAttributes = [];
        const attribute = findAttributeByQueryAttribute(stemConfig.attribute, collections, linkTypes);
        const constraint = this.checkOverrideConstraint(attribute, stemConfig.attribute);
        if (attribute) {
          const rowAttribute: DataAggregatorAttribute = {
            resourceIndex: stemConfig.attribute.resourceIndex,
            attributeId: attribute.id,
            data: stemConfig.attribute.constraint,
          };

          aggregatorAttributes.push(rowAttribute);
        }
        const valueAttribute: DataAggregatorAttribute = {
          resourceIndex: stemConfig.resource.resourceIndex,
          attributeId: null,
        };
        aggregatorAttributes.push(valueAttribute);
        if (aggregatorAttributes.length === 1) {
          aggregatorAttributes.push(valueAttribute);
        }

        const aggregatedData = this.dataAggregator.aggregateArray(aggregatorAttributes, []);

        for (const aggregatedDataItem of aggregatedData.items) {
          const firstChain = aggregatedDataItem.dataResourcesChains[0] || [];
          const title = aggregatedDataItem.value || '';
          const tableId = collection.id + title;
          const titleDataValue = constraint.createDataValue(title, constraintData);
          const titleDataResources = aggregatedDataItem.dataResources;

          for (const childItem of aggregatedDataItem.children || []) {
            const dataResources = <DocumentModel[]>childItem.dataResources || [];
            const dataResourcesChain = stemConfig.resource
              ? [...firstChain, ...(childItem.dataResourcesChains[0] || [])]
              : firstChain;

            const currentTable = currentTables.find(table => table.id === tableId) || tableByCollection;
            const rows = this.createDocumentRows(
              tableId,
              columns,
              currentTable?.rows || [],
              uniqueDocuments(dataResources),
              permissions
            );
            const workflowTable: WorkflowTable = {
              id: tableId,
              columns: columns.map(column => ({...column, tableId})),
              rows,
              collectionId: collection.id,
              title: attribute && {
                dataValue: titleDataValue,
                constraint,
                dataResources: titleDataResources,
              },
            };
            result.tables.push(workflowTable);
          }
        }

        result.actions.push(...actions);
        return result;
      },
      {tables: [], actions: []}
    );
  }

  private checkOverrideConstraint(attribute: Attribute, workflowAttribute: QueryAttribute): Constraint {
    const kanbanConstraint = workflowAttribute?.constraint;
    const overrideConstraint =
      kanbanConstraint &&
      this.constraintItemsFormatter.checkValidConstraintOverride(attribute?.constraint, kanbanConstraint);
    return overrideConstraint || attribute?.constraint || new UnknownConstraint();
  }

  private createColumns(
    currentColumns: TableColumn[],
    resource: AttributesResource,
    resourceType: AttributesResourceType,
    permissions: AllowedPermissions,
    query: Query,
    settings: ResourceAttributeSettings[]
  ): {columns: TableColumn[]; actions: Action[]} {
    const isCollection = resourceType === AttributesResourceType.Collection;
    const defaultAttributeId = isCollection ? getDefaultAttributeId(resource) : null;

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
        const column: TableColumn = {
          id: currentColumn?.id || generateId(),
          attribute,
          editable,
          width: currentColumn?.width || TABLE_COLUMN_WIDTH,
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

  private createDocumentRows(
    tableId: string,
    columns: TableColumn[],
    currentRows: TableRow[],
    documents: DocumentModel[],
    permissions: AllowedPermissions
  ): TableRow[] {
    const rowsMap = currentRows.reduce((result, row) => ({...result, [row.documentId || row.correlationId]: row}), {});

    const columnIdsMap = columns.reduce((idsMap, column) => {
      if (column.attribute) {
        idsMap[column.attribute.id] = column.id;
      }
      return idsMap;
    }, {});

    const pendingColumnValuesByRow = Object.keys(this.pendingColumnValues).reduce((result, columnId) => {
      const updates = this.pendingColumnValues[columnId];
      for (const update of updates) {
        if (!result[update.row.id]) {
          result[update.row.id] = {};
        }
        result[update.row.id][columnId] = update.value;
      }
      return result;
    }, {});

    const rows = documents.map((document, index) => {
      const currentRow = rowsMap[document.correlationId || document.id] || rowsMap[document.id];
      const documentData = objectKeys(document.data || {}).reduce((data, attributeId) => {
        if (columnIdsMap[attributeId]) {
          data[columnIdsMap[attributeId]] = document.data[attributeId];
        }
        return data;
      }, {});
      const pendingData = (currentRow && pendingColumnValuesByRow[currentRow.id]) || {};
      const id = currentRow?.id || document.id;
      const row: TableRow = {
        id,
        tableId,
        data: {...documentData, ...pendingData},
        documentId: document.id,
        height: currentRow?.height || TABLE_ROW_HEIGHT,
        correlationId: document.correlationId || id,
        menuItems: [],
      };
      row.menuItems.push(...this.menuService.createRowMenu(permissions, row));
      return row;
    });
    const rowsIds = new Set(rows.map(row => row.id));

    for (let i = 0; i < currentRows?.length; i++) {
      const row = currentRows[i];
      if (!row.documentId && !rowsIds.has(row.id)) {
        // we are adding new rows only to the end
        rows.push(row);
      }
    }

    if (permissions.writeWithView && !rows.some(row => !row.documentId)) {
      const id = generateId();
      const newRow: TableRow = {
        id,
        tableId,
        data: {},
        correlationId: id,
        height: TABLE_ROW_HEIGHT,
        menuItems: [],
      };
      newRow.menuItems.push(...this.menuService.createRowMenu(permissions, newRow));
      rows.push(newRow);
    }

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
      const {collection, linkType} = this.stateService.findColumnResources(column);
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

  public changeSort(column: TableColumn, sort: AttributeSortType) {
    const {collection, linkType} = this.stateService.findColumnResources(column);
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
    const {collection, linkType} = this.stateService.findColumnResources(column);
    this.store$.dispatch(
      new ViewSettingsAction.HideAttributes({
        attributeIds: [column.attribute.id],
        collection,
        linkType,
      })
    );
  }

  public showColumns(columns: TableColumn[]) {
    const {collection, linkType} = this.stateService.findColumnResources(columns[0]);
    this.store$.dispatch(
      new ViewSettingsAction.ShowAttributes({
        attributeIds: columns.map(column => column.attribute.id),
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

  public removeRow(row: TableRow, column: TableColumn) {
    if (row.documentId) {
      if (row.linkInstanceId) {
        // TODO remove only connection when its link
      } else {
        this.store$.dispatch(
          new DocumentsAction.DeleteConfirm({
            collectionId: column.collectionId,
            documentId: row.documentId,
          })
        );
      }
    } else {
      this.stateService.removeRow(row);
    }
  }

  public showRowDocumentDetail(row: TableRow) {
    this.store$
      .pipe(
        select(selectDocumentById(row.documentId)),
        switchMap(document =>
          this.store$.pipe(
            select(selectCollectionById(document.collectionId)),
            map(collection => ({collection, document}))
          )
        ),
        take(1)
      )
      .subscribe(({collection, document}) => this.modalService.showDataResourceDetail(document, collection));
  }

  public showRowDetail(row: TableRow, column: TableColumn) {
    if (row.documentId && column.collectionId) {
      this.store$
        .pipe(
          select(selectCollectionById(column.collectionId)),
          take(1),
          withLatestFrom(this.store$.pipe(select(selectDocumentById(row.documentId))))
        )
        .subscribe(([collection, document]) => this.modalService.showDataResourceDetail(document, collection));
    } else if (row.linkInstanceId && column.linkTypeId) {
      this.store$
        .pipe(
          select(selectLinkTypeById(column.linkTypeId)),
          take(1),
          withLatestFrom(this.store$.pipe(select(selectLinkInstanceById(row.linkInstanceId))))
        )
        .subscribe(([linkType, linkInstance]) => this.modalService.showDataResourceDetail(linkInstance, linkType));
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
}
