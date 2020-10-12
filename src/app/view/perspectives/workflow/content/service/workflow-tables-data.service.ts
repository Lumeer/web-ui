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
import {take, withLatestFrom} from 'rxjs/operators';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../../../../core/store/link-instances/link-instances.state';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query/query';
import {ResourceAttributeSettings, ViewSettings} from '../../../../../core/store/views/view';
import {TABLE_COLUMN_WIDTH, TABLE_ROW_HEIGHT, TableModel} from '../../../../../shared/table/model/table-model';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable
} from '../../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../../shared/settings/settings.util';
import {objectKeys} from 'codelyzer/util/objectKeys';
import {WorkflowTablesMenuService} from './workflow-tables-menu.service';
import {groupDocumentsByCollection} from '../../../../../core/store/documents/document.utils';

@Injectable()
export class WorkflowTablesDataService {

  private pendingColumnRenames: Record<string, string> = {};
  private pendingColumnValues: Record<string, Record<string, any>> = {};

  constructor(private store$: Store<AppState>,
              private menuService: WorkflowTablesMenuService,
              private modalService: ModalService,
              private i18n: I18n) {
  }

  public createTables(
    currentTables: TableModel[],
    collections: Collection[],
    documents: DocumentModel[],
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    viewSettings: ViewSettings
  ): TableModel[] {
    const documentsByCollection = groupDocumentsByCollection(documents);
    return collections.reduce((result, collection) => {
      const collectionDocuments = documentsByCollection[collection.id] || [];
      const collectionPermissions = permissions?.[collection.id];
      const collectionSettings = viewSettings?.attributes?.collections?.[collection.id] || [];
      const table = this.createTable(currentTables, collection, collectionDocuments, collectionPermissions, query, collectionSettings);
      return [...result, table];
    }, []);
  }

  private createTable(
    currentTables: TableModel[],
    collection: Collection,
    documents: DocumentModel[],
    permissions: AllowedPermissions,
    query: Query,
    settings: ResourceAttributeSettings[]
  ): TableModel {
    const currentTable = currentTables.find(table => table.collectionId === collection.id);
    const tableId = currentTable?.id || generateId();
    const columns = this.createCollectionColumns(
      tableId,
      currentTable?.columns || [],
      collection,
      permissions,
      query,
      settings
    );
    const rows = this.createDocumentRows(tableId, columns, currentTable?.rows || [], documents, permissions);
    return {id: tableId, columns, rows, collectionId: collection.id};
  }

  private createCollectionColumns(
    tableId: string,
    currentColumns: TableColumn[],
    collection: Collection,
    permissions: AllowedPermissions,
    query: Query,
    settings: ResourceAttributeSettings[]
  ) {
    const defaultAttributeId = getDefaultAttributeId(collection);

    const attributeColumns = createAttributesSettingsOrder(collection.attributes, settings).reduce<TableColumn[]>(
      (columns, setting) => {
        const attribute = findAttribute(collection.attributes, setting.attributeId);
        const editable = isCollectionAttributeEditable(attribute.id, collection, permissions, query);
        const currentColumn = currentColumns.find(
          c => c.collectionId === collection.id && c.attribute?.id === attribute.id
        );
        const column = {
          id: currentColumn?.id || generateId(),
          attribute,
          tableId,
          editable,
          width: currentColumn?.width || TABLE_COLUMN_WIDTH,
          collectionId: collection.id,
          color: collection.color,
          default: attribute.id === defaultAttributeId,
          hidden: setting.hidden,
          manageable: permissions?.manageWithView,
          menuItems: [],
        };
        column.menuItems.push(...this.menuService.createHeaderMenu(permissions, column, true));
        columns.push(column);
        return columns;
      },
      []
    );

    for (let i = 0; i < currentColumns?.length; i++) {
      const column = currentColumns[i];
      if (!column.attribute) {
        // TODO
      }
    }

    const lastColumn: TableColumn = {
      id: generateId(),
      tableId,
      name: 'A',
      collectionId: collection.id,
      editable: true,
      manageable: true,
      width: TABLE_COLUMN_WIDTH,
      color: collection.color,
      menuItems: [],
    };
    lastColumn.menuItems.push(...this.menuService.createHeaderMenu(permissions, lastColumn, true));

    attributeColumns.push(lastColumn);

    return attributeColumns;
  }

  private createDocumentRows(
    tableId: string,
    columns: TableColumn[],
    currentRows: TableRow[],
    documents: DocumentModel[],
    permissions: AllowedPermissions
  ): TableRow[] {
    const rowsMap = currentRows.reduce((map, row) => ({...map, [row.correlationId || row.documentId]: row}), {});

    const columnIdsMap = columns.reduce((idsMap, column) => {
      if (column.attribute) {
        idsMap[column.attribute.id] = column.id;
      }
      return idsMap;
    }, {});

    return documents.map(document => {
      const currentRow = rowsMap[document.correlationId || document.id];
      const row: TableRow = {
        id: currentRow?.id || generateId(),
        data: objectKeys(document.data || {}).reduce((data, attributeId) => {
          if (columnIdsMap[attributeId]) {
            data[columnIdsMap[attributeId]] = document.data[attributeId];
          }
          return data;
        }, {}),
        tableId,
        documentId: document.id,
        height: currentRow?.height || TABLE_ROW_HEIGHT,
        correlationId: document.correlationId,
        menuItems: [],
      };
      row.menuItems.push(...this.menuService.createRowMenu(permissions, row));
      return row;
    });
  }

  public createAttribute(column: TableColumn, name: string, onSuccess?: (Attribute) => void) {
    if (this.isColumnCreating(column)) {
      this.pendingColumnRenames[column.id] = name;
    } else {
      const attribute: Attribute = {name, correlationId: column.id};
      if (column.collectionId) {
        this.pendingColumnRenames[column.id] = name;
        this.store$.dispatch(new CollectionsAction.CreateAttributes({
          collectionId: column.collectionId,
          attributes: [attribute],
          onSuccess: (attributes => {
            const pendingName = this.pendingColumnRenames[column.id];
            onSuccess?.({...attributes[0], name: pendingName})
            this.onAttributeCreated(attributes[0], column);
          }),
          onFailure: () => (delete this.pendingColumnRenames[column.id])
        }));
      } else if (column.linkTypeId) {
        this.pendingColumnRenames[column.id] = name;
        this.store$.dispatch(new LinkTypesAction.CreateAttributes({
          linkTypeId: column.linkTypeId,
          attributes: [attribute],
          onSuccess: (attributes => {
            const pendingName = this.pendingColumnRenames[column.id];
            onSuccess?.({...attributes[0], name: pendingName})
            this.onAttributeCreated(attributes[0], column);
          }),
          onFailure: () => (delete this.pendingColumnRenames[column.id])
        }));
      }
    }
  }

  private isColumnCreating(column: TableColumn): boolean {
    return !!this.pendingColumnRenames[column.id];
  }

  private onAttributeCreated(attribute: Attribute, column: TableColumn) {
    if (attribute.name !== this.pendingColumnRenames[column.id]) {
      this.renameAttribute({...column, attribute}, this.pendingColumnRenames[column.id]);
    }

    if (this.pendingColumnValues[column.id]) {
      console.log('i should send row updates');
    }

    delete this.pendingColumnRenames[column.id];
    delete this.pendingColumnValues[column.id];
  }

  public removeRow(row: TableRow, column: TableColumn) {
    if (row.documentId && column.collectionId) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: column.collectionId,
          documentId: row.documentId,
        })
      );
    } else {
      // TODO
    }
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
      // TODO link
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
      this.patchData(row, column, value);
    } else {
      this.pendingColumnValues[column.id] = this.pendingColumnValues[column.id] || {};
      this.pendingColumnValues[column.id][row.id] = value;

      if (!this.isColumnCreating(column)) {
        this.createAttribute(column, column.name);
      }
    }
  }

  private patchData(row: TableRow, column: TableColumn, value: any) {
    const patchData = {[column.attribute.id]: value};
    if (column.collectionId && row.documentId) {
      const document: DocumentModel = {
        id: row.documentId,
        collectionId: column.collectionId,
        data: patchData,
      };
      this.store$.dispatch(new DocumentsAction.PatchData({document}));
    } else if (column.linkTypeId && row.linkInstanceId) {
      const linkInstance: LinkInstance = {
        id: row.linkInstanceId,
        linkTypeId: column.linkTypeId,
        data: patchData,
        documentIds: ['', ''],
      };
      this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
    }
  }
}
