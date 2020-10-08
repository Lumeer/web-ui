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
  TABLE_COLUMN_WIDTH,
  TABLE_ROW_HEIGHT,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../../shared/table/model/table-model';
import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query/query';
import {ResourceAttributeSettings, ViewSettings} from '../../../../../core/store/views/view';
import {
  findAttribute,
  getDefaultAttributeId,
  isCollectionAttributeEditable,
} from '../../../../../core/store/collections/collection.util';
import {createAttributesSettingsOrder} from '../../../../../shared/settings/settings.util';
import {TableColumn, TableContextMenuItem} from '../../../../../shared/table/model/table-column';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {TableRow} from '../../../../../shared/table/model/table-row';
import {moveItemsInArray} from '../../../../../shared/utils/array.utils';
import {KeyCode} from '../../../../../shared/key-code';
import {isNotNullOrUndefined, preventEvent} from '../../../../../shared/utils/common.utils';
import {DataRowHiddenComponent} from '../../../../../shared/data/data-row-component';
import {distinctUntilChanged, skip} from 'rxjs/operators';
import {DataInputSaveAction} from '../../../../../shared/data-input/data-input-save-action';
import {HeaderMenuId, RowMenuId, WorkflowTablesMenuService} from './workflow-tables-menu.service';
import {WorkflowTablesDataService} from './workflow-tables-data.service';

@Injectable()
export class WorkflowTablesService {
  private hiddenComponent?: () => DataRowHiddenComponent;

  public selectedCell$ = new BehaviorSubject<SelectedTableCell>(null);
  public editedCell$ = new BehaviorSubject<EditedTableCell>(null);
  public tables$ = new BehaviorSubject<TableModel[]>([]);

  constructor(private dataService: WorkflowTablesDataService, private menuService: WorkflowTablesMenuService) {
    this.selectedCell$.pipe(skip(1), distinctUntilChanged()).subscribe(() => {
      if (this.isSelected()) {
        this.hiddenComponent()?.focus();
      } else {
        this.hiddenComponent()?.blur();
      }
    });
  }

  public onRowMenuSelected(row: TableRow, column: TableColumn, item: TableContextMenuItem) {
    switch (item.id) {
      case RowMenuId.Edit:
        this.setEditedCell({rowId: row.id, columnId: column.id, tableId: column.tableId, type: TableCellType.Body});
        break;
      case RowMenuId.Detail:
        this.dataService.showRowDetail(row, column);
        break;
      case HeaderMenuId.Delete:
        this.dataService.removeRow(row, column);
        break;
    }
  }

  public onColumnHiddenMenuSelected(columns: TableColumn[]) {
    const newTables = [...this.tables$.value];
    const table = this.tables$.value.find(t => t.id === columns[0].tableId);

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

    this.tables$.next(newTables);
  }

  public onColumnMenuSelected(column: TableColumn, item: TableContextMenuItem) {
    switch (item.id) {
      case HeaderMenuId.Edit:
        this.setEditedCell({columnId: column.id, tableId: column.tableId, type: TableCellType.Header});
        break;
      case HeaderMenuId.Type:
        this.dataService.showAttributeType(column);
        break;
      case HeaderMenuId.Function:
        this.dataService.showAttributeFunction(column);
        break;
      case HeaderMenuId.Delete:
        this.deleteColumn(column);
        break;
      case HeaderMenuId.Displayed:
        this.setDisplayedAttribute(column);
        break;
      case HeaderMenuId.Hide:
        this.hideColumn(column);
    }
  }

  private setDisplayedAttribute(column: TableColumn) {
    if (column?.collectionId && column?.attribute?.id) {
      this.dataService.setDisplayedAttribute(column);
    }
  }

  private deleteColumn(column: TableColumn) {
    if (column.attribute) {
      this.dataService.deleteAttribute(column);
    } else {
      this.deleteUninitializedColumn(column);
    }
  }

  private deleteUninitializedColumn(column: TableColumn) {
    const newTables = [...this.tables$.value];
    const table = this.tables$.value.find(t => t.id === column.tableId);
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

    this.tables$.next(newTables);
  }

  private hideColumn(column: TableColumn) {
    const table = this.tables$.value.find(t => t.id === column.tableId);
    if (table) {
      this.setColumnProperty(table, column, 'hidden', true);
    }
  }

  public setHiddenComponent(hiddenComponent?: () => DataRowHiddenComponent) {
    this.hiddenComponent = hiddenComponent;
  }

  public onRowNewValue(row: TableRow, column: TableColumn, value: any, action: DataInputSaveAction) {
    this.dataService.saveRowNewValue(row, column, value);

    const cell = {rowId: row.id, columnId: column.id, type: TableCellType.Body, tableId: column.tableId};
    this.onCellSave(cell, action);
  }

  public resetSelection() {
    this.selectedCell$.next(null);
    this.editedCell$.next(null);
  }

  public newHiddenInput(value: string) {
    if (this.isSelected()) {
      const selectedCell = this.selectedCell$.value;
      this.setEditedCell(selectedCell, value);
    }
  }

  public resetCellSelection(cell: TableCell, action: DataInputSaveAction) {
    if (action === DataInputSaveAction.Enter) {
      return;
    }
    if (this.isEditing() && this.isEditingCell(cell)) {
      this.setSelectedCell({...cell});
    } else if (this.isSelected() && this.isCellSelected(cell)) {
      this.selectedCell$.next(null);
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
      case KeyCode.ArrowUp:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
        this.onArrowKeyDown(event);
        break;
      case KeyCode.Tab:
        this.onTabKeyDown(event);
        break;
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
        this.onEnterKeyDown(event);
        break;
      case KeyCode.F2:
        this.onF2KeyDown(event);
        break;
      case KeyCode.Backspace:
        this.onBackSpaceKeyDown(event);
        break;
    }
  }

  private onBackSpaceKeyDown(event: KeyboardEvent) {
    if (!this.isSelected()) {
      return;
    }

    preventEvent(event);

    const selectedCell = this.selectedCell$.value;
    this.setEditedCell(selectedCell, '');
  }

  private onF2KeyDown(event: KeyboardEvent) {
    if (this.isSelected()) {
      const selectedCell = this.selectedCell$.value;
      this.setEditedCell(selectedCell);
    } else if (this.isEditing()) {
      const editedCell = this.editedCell$.value;
      this.setSelectedCell(editedCell);
    }
  }

  private onEnterKeyDown(event: KeyboardEvent) {
    preventEvent(event);

    if (this.isEditing()) {
      if (this.editedCell$.value.type === TableCellType.Body) {
        this.moveSelectionDownFromEdited();
      } else {
        this.setSelectedCell(this.editedCell$.value);
      }
    } else if (this.isSelected()) {
      const selectedCell = this.selectedCell$.value;
      this.setEditedCell(selectedCell);
    }
  }

  private moveSelectionDownFromEdited() {
    const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.editedCell$.value);
    if (this.numberOfRowsInTable(tableIndex) - 1 === rowIndex) {
      const editedCell = this.editedCell$.value;
      this.selectedCell$.next({...editedCell});
    } else {
      this.selectCell(tableIndex, rowIndex + 1, columnIndex);
    }
    this.editedCell$.next(null);
  }

  private setEditedCell(cell: TableCell, inputValue?: any) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canEditCell(cell, column)) {
      this.selectedCell$.next(null);
      this.editedCell$.next({...cell, inputValue});
    }
  }

  private setSelectedCell(cell: TableCell) {
    const column = this.findTableColumn(cell.tableId, cell.columnId);
    if (canSelectCell(cell, column)) {
      this.selectedCell$.next(cell);
      this.editedCell$.next(null);
    }
  }

  private findTableColumn(tableId: string, columnId: string): TableColumn {
    const table = this.tables$.value.find(t => t.id === tableId);
    return table?.columns.find(column => column.id === columnId);
  }

  private onTabKeyDown(event: KeyboardEvent) {
    preventEvent(event);

    if (this.isEditing()) {
      const {tableIndex, rowIndex, columnIndex, type} = this.getCellIndexes(this.editedCell$.value);
      if (event.shiftKey) {
        this.selectCell(tableIndex, rowIndex, columnIndex - 1, type);
      } else {
        this.selectCell(tableIndex, rowIndex, columnIndex + 1, type);
      }
      this.editedCell$.next(null);
    } else if (this.isSelected()) {
      this.onArrowKeyDown(event);
    }
  }

  private onArrowKeyDown(event: KeyboardEvent) {
    if (
      this.isEditing() ||
      !this.isSelected() ||
      (event.shiftKey && event.code !== KeyCode.Tab) ||
      event.altKey ||
      event.ctrlKey
    ) {
      return;
    }
    preventEvent(event);

    switch (this.selectedCell$.value.type) {
      case TableCellType.Header:
        this.onArrowKeyDownInHeader(event);
        break;
      case TableCellType.Body:
        this.onArrowKeyDownInBody(event);
        break;
    }
  }

  private onArrowKeyDownInHeader(event: KeyboardEvent) {
    const {tableIndex, columnIndex} = this.getCellIndexes(this.selectedCell$.value);
    const table = this.tables$.value[tableIndex];
    const arrowLeftIndex = this.firstNonHiddenColumnIndex(table, 0, columnIndex - 1, true);
    const arrowRightIndex = this.firstNonHiddenColumnIndex(table, columnIndex + 1, table.columns.length);
    switch (event.code) {
      case KeyCode.ArrowUp:
        if (tableIndex > 0) {
          const nextTableIndex = tableIndex - 1;
          const nextRowIndex = this.numberOfRowsInTable(nextTableIndex) - 1;
          const nextColumnIndex = Math.min(columnIndex, this.numberOfColumnsInTable(nextTableIndex) - 1);
          this.selectCell(nextTableIndex, nextRowIndex, nextColumnIndex);
        }
        break;
      case KeyCode.ArrowDown:
        this.selectCell(tableIndex, 0, columnIndex);
        break;
      case KeyCode.ArrowLeft:
        this.selectCell(tableIndex, null, arrowLeftIndex, TableCellType.Header);
        break;
      case KeyCode.ArrowRight:
        this.selectCell(tableIndex, null, arrowRightIndex, TableCellType.Header);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.selectCell(tableIndex, null, arrowLeftIndex, TableCellType.Header);
        } else {
          this.selectCell(tableIndex, null, arrowRightIndex, TableCellType.Header);
        }
        break;
    }
  }

  private firstNonHiddenColumnIndex(table: TableModel, from: number, to: number, fromEnd?: boolean): number {
    if (fromEnd) {
      const index = table.columns
        .slice(from, to + 1)
        .reverse()
        .findIndex(column => !column.hidden);
      const count = to - from;
      return index >= 0 ? count - index : to + 1;
    }
    return table.columns.slice(from, to).findIndex(column => !column.hidden) + from;
  }

  private numberOfRowsInTable(tableIndex: number): number {
    return this.tables$.value[tableIndex]?.rows?.length || 0;
  }

  private numberOfColumnsInTable(tableIndex: number): number {
    return this.tables$.value[tableIndex]?.columns?.length || 0;
  }

  private selectCell(
    tableIndex: number,
    rowIndex: number | null,
    columnIndex: number,
    type: TableCellType = TableCellType.Body
  ) {
    const table = this.tables$.value[tableIndex];
    if (table) {
      const column = table.columns[columnIndex];
      const row = isNotNullOrUndefined(rowIndex) ? table.rows[rowIndex] : null;
      if (column && (row || type !== TableCellType.Body)) {
        this.setSelectedCell({tableId: table.id, columnId: column.id, rowId: row?.id, type});
      }
    }
  }

  private onArrowKeyDownInBody(event: KeyboardEvent) {
    const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.selectedCell$.value);
    const table = this.tables$.value[tableIndex];
    const arrowLeftIndex = this.firstNonHiddenColumnIndex(table, 0, columnIndex - 1, true);
    const arrowRightIndex = this.firstNonHiddenColumnIndex(table, columnIndex + 1, table.columns.length);
    switch (event.code) {
      case KeyCode.ArrowUp:
        if (rowIndex === 0) {
          this.selectCell(tableIndex, null, columnIndex, TableCellType.Header);
        } else {
          this.selectCell(tableIndex, rowIndex - 1, columnIndex);
        }
        break;
      case KeyCode.ArrowDown:
        if (this.numberOfRowsInTable(tableIndex) - 1 === rowIndex) {
          const nextTableIndex = tableIndex + 1;
          const nextColumnIndex = Math.min(columnIndex, this.numberOfColumnsInTable(nextTableIndex) - 1);
          this.selectCell(nextTableIndex, null, nextColumnIndex, TableCellType.Header);
        } else {
          this.selectCell(tableIndex, rowIndex + 1, columnIndex);
        }
        break;
      case KeyCode.ArrowLeft:
        this.selectCell(tableIndex, rowIndex, arrowLeftIndex);
        break;
      case KeyCode.ArrowRight:
        this.selectCell(tableIndex, rowIndex, arrowRightIndex);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.selectCell(tableIndex, rowIndex, arrowLeftIndex);
        } else {
          this.selectCell(tableIndex, rowIndex, arrowRightIndex);
        }
        break;
    }
  }

  private getCellIndexes(
    cell: TableCell
  ): {tableIndex: number; rowIndex: number; columnIndex: number; type: TableCellType} {
    const tableIndex = this.tables$.value.findIndex(table => table.id === cell.tableId);
    const tableByIndex = this.tables$.value[tableIndex];
    const columnIndex = tableByIndex?.columns.findIndex(column => column.id === cell.columnId);
    const rowIndex = tableByIndex?.rows.findIndex(row => row.id === cell.rowId);
    return {tableIndex, columnIndex, rowIndex, type: cell.type};
  }

  private isEditing(): boolean {
    return isNotNullOrUndefined(this.editedCell$.value);
  }

  private isEditingCell(cell: TableCell): boolean {
    return this.isEditing() && cellsAreSame(cell, this.editedCell$.value);
  }

  private isSelected(): boolean {
    return isNotNullOrUndefined(this.selectedCell$.value);
  }

  private isCellSelected(cell: TableCell): boolean {
    return this.isSelected() && cellsAreSame(cell, this.selectedCell$.value);
  }

  public onCellClick(cell: TableCell) {
    this.setSelectedCell({...cell});
  }

  public onCellSave(cell: TableCell, action: DataInputSaveAction) {
    if (this.isEditingCell(cell)) {
      if ([DataInputSaveAction.Button, DataInputSaveAction.Select].includes(action)) {
        this.setSelectedCell({...cell});
      } else if (DataInputSaveAction.Direct === action) {
        this.moveSelectionDownFromEdited();
      }
    }
  }

  public onCellDoubleClick(cell: TableCell) {
    this.setEditedCell(cell);
  }

  public onColumnRename(column: TableColumn, name: string) {
    if (column?.attribute) {
      this.dataService.renameAttribute(column, name);
    } else {
      const table = this.findTableByColumn(column);
      this.setColumnProperty(table, column, 'name', name);
    }
  }

  private findTableByColumn(column: TableColumn): TableModel {
    return this.tables$.value.find(table => table.id === column.tableId);
  }

  public onColumnResize(changedTable: TableModel, column: TableColumn, width: number) {
    this.setColumnProperty(changedTable, column, 'width', width);
  }

  private setColumnProperty(table: TableModel, column: TableColumn, property: string, value: any) {
    const newTables = [...this.tables$.value];
    for (let i = 0; i < newTables.length; i++) {
      const newTable = newTables[i];
      if (tablesAreSame(table, newTable)) {
        const columnIndex = newTable.columns.findIndex(col => col.id === column.id);

        if (columnIndex !== -1) {
          const columns = [...newTable.columns];
          columns[columnIndex] = {...newTable.columns[columnIndex], [property]: value};
          newTables[i] = {...newTable, columns};
        }
      }
    }

    this.tables$.next(newTables);
  }

  public onColumnMove(changedTable: TableModel, from: number, to: number) {
    const newTables = [...this.tables$.value];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      if (tablesAreSame(table, changedTable)) {
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
      return [...result, table];
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
    const currentTable = this.tables$.value.find(table => table.collectionId === collection.id);
    const tableId = currentTable?.id || generateId();
    const columns = this.createCollectionColumns(
      tableId,
      currentTable?.columns || [],
      collection,
      permissions,
      query,
      settings
    );
    const rows = this.createDocumentRows(tableId, currentTable?.rows || [], documents, permissions);
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
    currentRows: TableRow[],
    documents: DocumentModel[],
    permissions: AllowedPermissions
  ): TableRow[] {
    const rowsMap = currentRows.reduce((map, row) => ({...map, [row.correlationId || row.documentId]: row}), {});

    return documents.map(document => {
      const currentRow = rowsMap[document.correlationId || document.id];
      const row = {
        id: currentRow?.id || generateId(),
        documentData: document.data,
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
    return column.manageable;
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
