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

import {BehaviorSubject} from 'rxjs';
import {EditedTableCell, SelectedTableCell, TableCell, TableModel} from '../../../../shared/table/model/table-model';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {ResourceAttributeSettings, ViewSettings} from '../../../../core/store/views/view';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../shared/settings/settings.util';
import {TableColumn} from '../../../../shared/table/model/table-column';
import {generateId} from '../../../../shared/utils/resource.utils';
import {TableRow} from '../../../../shared/table/model/table-row';
import {moveItemsInArray} from '../../../../shared/utils/array.utils';

export class WorkflowTablesService {
  public selectedCell$ = new BehaviorSubject<SelectedTableCell>(null);
  public editedCell$ = new BehaviorSubject<EditedTableCell>(null);
  public tables$ = new BehaviorSubject<TableModel[]>([]);

  public onCellClick(cell: TableCell) {
    this.selectedCell$.next({...cell});
  }

  public onCellDoubleClick(cell: TableCell) {
    this.editedCell$.next({...cell, inputValue: null});
  }

  public onColumnResize(changedTable: TableModel, columnId: string, width: number) {
    const newTables = [...this.tables$.value];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      if (table.collectionId === changedTable.collectionId) {
        const columnIndex = newTables[i].columns.findIndex(column => column.id === columnId);

        if (columnIndex !== -1) {
          const newColumns = [...table.columns];
          newColumns[columnIndex] = {...table.columns[columnIndex], width};
          newTables[i] = {...table, columns: newColumns};
        }
      }
    }

    this.tables$.next(newTables);
  }

  public onColumnMove(changedTable: TableModel, from: number, to: number) {
    const newTables = [...this.tables$.value];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      if (table.collectionId === changedTable.collectionId) {
        const newColumns = moveItemsInArray(table.columns, from, to);
        newTables[i] = {...table, columns: newColumns};
      }
    }

    this.tables$.next(newTables);
  }

  public onUpdateData(
    collections: Collection[],
    documents: DocumentModel[],
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    viewSettings: ViewSettings
  ) {
    const newTables = collections.reduce((result, collection) => {
      const collectionDocuments = documents.filter(document => document.collectionId === collection.id);
      const collectionPermissions = permissions?.[collection.id];
      const collectionSettings = viewSettings?.attributes?.collections?.[collection.id] || [];
      const table = this.createTable(collection, collectionDocuments, collectionPermissions, query, collectionSettings);
      result.push(table);
      result.push(table);
      return result;
    }, []);
    this.tables$.next(newTables);
  }

  private createTable(
    collection: Collection,
    documents: DocumentModel[],
    permissions: AllowedPermissions,
    query: Query,
    settings: ResourceAttributeSettings[]
  ): TableModel {
    const currentTable = this.tables$.value.find(table => table.id === collection.id);
    const columns = this.createCollectionColumns(currentTable?.columns || [], collection, permissions, query, settings);
    const rows = this.createDocumentRows(currentTable?.rows || [], documents);
    return {columns, rows, id: currentTable?.id || generateId(), collectionId: collection.id};
  }

  private createCollectionColumns(
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
          width: currentColumn?.width || 100,
          collectionId: collection.id,
          color: collection.color,
          bold: attribute.id === defaultAttributeId,
          hidden: setting.hidden,
          editable,
        };
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

    return attributeColumns;
  }

  private createDocumentRows(currentRows: TableRow[], documents: DocumentModel[]): TableRow[] {
    return documents.map(document => ({id: generateId(), documentData: document.data, documentId: document.id}));
  }
}
