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
import {BehaviorSubject} from 'rxjs';
import {
  EditedTableCell,
  SelectedTableCell,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../shared/table/model/table-model';
import {TableColumn} from '../../../../../shared/table/model/table-column';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query/query';
import {ViewSettings} from '../../../../../core/store/views/view';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {TableRow} from '../../../../../shared/table/model/table-row';
import {moveItemsInArray} from '../../../../../shared/utils/array.utils';

@Injectable()
export class WorkflowTablesStateService {
  public readonly selectedCell$ = new BehaviorSubject<SelectedTableCell>(null);
  public readonly editedCell$ = new BehaviorSubject<EditedTableCell>(null);
  public readonly tables$ = new BehaviorSubject<TableModel[]>([]);

  private collections: Collection[];
  private documents: DocumentModel[];
  private query: Query;
  private viewSettings: ViewSettings;
  private permissions: Record<string, AllowedPermissions>;

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    viewSettings: ViewSettings
  ) {
    this.collections = collections;
    this.documents = documents;
    this.permissions = permissions;
    this.query = query;
    this.viewSettings = viewSettings;
  }

  public setTables(tables: TableModel[]) {
    this.tables$.next(tables);
  }

  public get tables(): TableModel[] {
    return this.tables$.value;
  }

  public get selectedCell(): SelectedTableCell {
    return {...this.selectedCell$.value};
  }

  public get editedCell(): SelectedTableCell {
    return {...this.editedCell$.value};
  }

  public getColumnPermissions(column: TableColumn): AllowedPermissions {
    if (column.collectionId) {
      return this.permissions?.[column.collectionId];
    }
    // TODO links
    return {};
  }

  public isEditing(): boolean {
    return isNotNullOrUndefined(this.editedCell$.value);
  }

  public isEditingCell(cell: TableCell): boolean {
    return this.isEditing() && cellsAreSame(cell, this.editedCell$.value);
  }

  public isSelected(): boolean {
    return isNotNullOrUndefined(this.selectedCell$.value);
  }

  public isCellSelected(cell: TableCell): boolean {
    return this.isSelected() && cellsAreSame(cell, this.selectedCell$.value);
  }

  public resetSelection() {
    this.resetSelectedCell();
    this.resetEditedCell();
  }

  public resetSelectedCell() {
    this.selectedCell$.next(null);
  }

  public resetEditedCell() {
    this.editedCell$.next(null);
  }

  public setEditedCell(cell: TableCell, inputValue?: any) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canEditCell(cell, column)) {
      this.selectedCell$.next(null);
      this.editedCell$.next({...cell, inputValue});
    }
  }

  public setSelectedCell(cell: TableCell) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canSelectCell(cell, column)) {
      this.selectedCell$.next(cell);
      this.editedCell$.next(null);
    }
  }

  public findTableColumn(tableId: string, columnId: string): TableColumn {
    const table = this.tables.find(t => t.id === tableId);
    return table?.columns.find(column => column.id === columnId);
  }

  public selectCell(
    tableIndex: number,
    rowIndex: number | null,
    columnIndex: number,
    type: TableCellType = TableCellType.Body
  ) {
    const table = this.tables[tableIndex];
    if (table) {
      const column = table.columns[columnIndex];
      const row = isNotNullOrUndefined(rowIndex) ? table.rows[rowIndex] : null;
      if (column && (row || type !== TableCellType.Body)) {
        this.setSelectedCell({tableId: table.id, columnId: column.id, rowId: row?.id, type});
      }
    }
  }

  public moveSelectionDownFromEdited() {
    const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.editedCell);
    if (this.numberOfRowsInTable(tableIndex) - 1 === rowIndex) {
      this.setSelectedCell(this.editedCell);
    } else {
      this.selectCell(tableIndex, rowIndex + 1, columnIndex);
      this.resetEditedCell();
    }
  }

  private numberOfRowsInTable(tableIndex: number): number {
    return this.tables[tableIndex]?.rows?.length || 0;
  }

  public getCellIndexes(
    cell: TableCell
  ): {tableIndex: number; rowIndex: number; columnIndex: number; type: TableCellType} {
    const tableIndex = this.tables.findIndex(table => table.id === cell.tableId);
    const tableByIndex = this.tables[tableIndex];
    const columnIndex = tableByIndex?.columns.findIndex(column => column.id === cell.columnId);
    const rowIndex = tableByIndex?.rows.findIndex(row => row.id === cell.rowId);
    return {tableIndex, columnIndex, rowIndex, type: cell.type};
  }

  private setColumnProperty(table: TableModel, column: TableColumn, properties: Record<string, any>) {
    const newTables = [...this.tables];
    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        const columnIndex = newTable.columns.findIndex(col => col.id === column.id);

        if (columnIndex !== -1) {
          const columns = [...newTable.columns];
          columns[columnIndex] = {...newTable.columns[columnIndex], ...properties};
          newTables[i] = {...newTable, columns};
        }
      }
    }

    this.setTables(newTables);
  }

  public showColumns(columns: TableColumn[]) {
    const newTables = [...this.tables];
    const table = this.findTableByColumn(columns[0]);

    const newColumns = [...table.columns];
    for (let j = 0; j < columns.length; j++) {
      const columnIndex = newColumns.findIndex(col => col.id === columns[j].id);

      if (columnIndex !== -1) {
        newColumns[columnIndex] = {...newColumns[columnIndex], hidden: false};
      }
    }

    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        newTables[i] = {...newTable, columns: newColumns};
      }
    }

    this.setTables(newTables);
  }

  public deleteColumn(column: TableColumn) {
    const newTables = [...this.tables];
    const table = this.findTableByColumn(column);
    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        const columnIndex = newTable.columns.findIndex(col => col.id === column.id);

        if (columnIndex !== -1) {
          const columns = [...newTable.columns];
          columns.splice(columnIndex, 1);
          newTables[i] = {...newTable, columns};
        }
      }
    }

    this.setTables(newTables);
  }

  public hideColumn(column: TableColumn) {
    const table = this.findTableByColumn(column);
    if (table) {
      this.setColumnProperty(table, column, {['hidden']: true});
    }
  }

  public addColumnToPosition(column: TableColumn, direction: number) {
    const table = this.findTableByColumn(column);
    const columnIndex = table?.columns.findIndex(c => c.id === column.id);
    if (columnIndex > -1) {
      const newTables = [...this.tables];

      for (let i = 0; i < newTables.length; i++) {
        const newTable = newTables[i];
        if (tablesAreSame(table, newTable)) {
          const columns = [...newTable.columns];
          columns.splice(columnIndex + direction, 0, {...column, tableId: newTable.id});
          newTables[i] = {...newTable, columns};
        }
      }

      this.setTables(newTables);
    }
  }

  public setRowValue(row: TableRow, column: TableColumn, value: any) {
    const tableIndex = this.findTableIndexByColumn(column);
    const rowIndex = this.tables[tableIndex]?.rows.findIndex(r => r.id === row.id);
    if (rowIndex > -1) {
      const newTables = [...this.tables];
      const newRows = [...newTables[tableIndex].rows];
      const currentRow = newRows[rowIndex];
      newRows[rowIndex] = {...currentRow, data: {...currentRow.data, [column.id]: value}};
      newTables[tableIndex] = {...newTables[tableIndex], rows: newRows};

      this.setTables(newTables);
    }
  }

  public startColumnCreating(column: TableColumn, name: string) {
    const table = this.findTableByColumn(column);
    this.setColumnProperty(table, column, {['name']: name, ['creating']: true});
  }

  public endColumnCreating(column: TableColumn) {
    const table = this.findTableByColumn(column);
    this.setColumnProperty(table, column, {['creating']: false});
  }

  public resizeColumn(changedTable: TableModel, column: TableColumn, width: number) {
    this.setColumnProperty(changedTable, column, {['width']: width});
  }

  public moveColumns(changedTable: TableModel, from: number, to: number) {
    const newTables = [...this.tables];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      if (tablesAreSame(table, changedTable)) {
        const newColumns = moveItemsInArray(table.columns, from, to);
        newTables[i] = {...table, columns: newColumns};
      }
    }

    this.setTables(newTables);
  }

  private findTableByColumn(column: TableColumn): TableModel {
    return this.tables.find(table => table.id === column.tableId);
  }

  private findTableIndexByColumn(column: TableColumn): number {
    return this.tables.findIndex(table => table.id === column.tableId);
  }
}

function tablesAreSame(t1: TableModel, t2: TableModel): boolean {
  return t1.collectionId === t2.collectionId;
}

function cellsAreSame(c1: TableCell, c2: TableCell): boolean {
  const columnAndTableAreSame = c1.type === c2.type && c1.tableId === c2.tableId && c1.columnId === c2.columnId;
  if (c1.type === TableCellType.Body) {
    return columnAndTableAreSame && c1.rowId === c2.rowId;
  }
  return columnAndTableAreSame;
}

function canEditCell(cell: TableCell, column: TableColumn): boolean {
  if (column.hidden) {
    return false;
  }
  if (cell.type === TableCellType.Header) {
    return column.manageable && !column.creating;
  } else if (cell.type === TableCellType.Body) {
    return column.editable;
  }
  return false;
}

function canSelectCell(cell: TableCell, column: TableColumn): boolean {
  if (column.hidden) {
    return false;
  }
  return true;
}
