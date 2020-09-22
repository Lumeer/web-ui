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
import {
  EditedTableCell,
  SelectedTableCell,
  TABLE_ROW_HEIGHT,
  TableCell,
  TableCellType,
  TableModel,
} from '../../../../shared/table/model/table-model';
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
import {KeyCode} from '../../../../shared/key-code';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {DataRowHiddenComponent} from '../../../../shared/data/data-row-component';
import {distinctUntilChanged, skip} from 'rxjs/operators';

export class WorkflowTablesService {
  public selectedCell$ = new BehaviorSubject<SelectedTableCell>(null);
  public editedCell$ = new BehaviorSubject<EditedTableCell>(null);
  public tables$ = new BehaviorSubject<TableModel[]>([]);

  constructor(private hiddenComponent?: () => DataRowHiddenComponent) {
    this.selectedCell$.pipe(skip(1), distinctUntilChanged()).subscribe(() => {
      if (this.isSelected()) {
        this.hiddenComponent()?.focus();
      } else {
        this.hiddenComponent()?.blur();
      }
    });
  }

  public resetSelection() {
    this.selectedCell$.next(null);
    this.editedCell$.next(null);
  }

  public newHiddenInput(value: string) {
    if (this.isSelected()) {
      const selectedCell = this.selectedCell$.value;
      this.selectedCell$.next(null);
      this.editedCell$.next({...selectedCell, inputValue: value});
    }
  }

  public resetCellSelection(cell: TableCell) {
    if (this.isEditing() && this.isEditingCell(cell)) {
      this.editedCell$.next(null);
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

    event.preventDefault();
    event.stopPropagation();

    const selectedCell = this.selectedCell$.value;
    this.selectedCell$.next(null);
    this.editedCell$.next({...selectedCell, inputValue: ''});
  }

  private onF2KeyDown(event: KeyboardEvent) {
    if (this.isSelected()) {
      const selectedCell = this.selectedCell$.value;
      this.selectedCell$.next(null);
      this.editedCell$.next({...selectedCell, inputValue: null});
    } else if (this.isEditing()) {
      const editedCell = this.editedCell$.value;
      this.selectedCell$.next(editedCell);
      this.editedCell$.next(null);
    }
  }

  private onEnterKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isEditing()) {
      const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.editedCell$.value);
      if (this.numberOfRowsInTable(tableIndex) - 1 === rowIndex) {
        const editedCell = this.editedCell$.value;
        this.selectedCell$.next(editedCell);
      } else {
        this.selectCell(tableIndex, rowIndex + 1, columnIndex);
      }
      this.editedCell$.next(null);
    } else if (this.isSelected()) {
      const selectedCell = this.selectedCell$.value;
      this.selectedCell$.next(null);
      this.editedCell$.next({...selectedCell, inputValue: null});
    }
  }

  private onTabKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isEditing()) {
      const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.editedCell$.value);
      if (event.shiftKey) {
        this.selectCell(tableIndex, rowIndex, columnIndex - 1);
      } else {
        this.selectCell(tableIndex, rowIndex, columnIndex + 1);
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
    event.preventDefault();
    event.stopPropagation();

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
        this.selectCell(tableIndex, null, columnIndex - 1, TableCellType.Header);
        break;
      case KeyCode.ArrowRight:
        this.selectCell(tableIndex, null, columnIndex + 1, TableCellType.Header);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.selectCell(tableIndex, null, columnIndex - 1, TableCellType.Header);
        } else {
          this.selectCell(tableIndex, null, columnIndex + 1, TableCellType.Header);
        }
        break;
    }
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
        this.selectedCell$.next({tableId: table.id, columnId: column.id, rowId: row?.id, type});
      }
    }
  }

  private onArrowKeyDownInBody(event: KeyboardEvent) {
    const {tableIndex, rowIndex, columnIndex} = this.getCellIndexes(this.selectedCell$.value);
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
        this.selectCell(tableIndex, rowIndex, columnIndex - 1);
        break;
      case KeyCode.ArrowRight:
        this.selectCell(tableIndex, rowIndex, columnIndex + 1);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.selectCell(tableIndex, rowIndex, columnIndex - 1);
        } else {
          this.selectCell(tableIndex, rowIndex, columnIndex + 1);
        }
        break;
    }
  }

  private getCellIndexes(cell: TableCell): {tableIndex: number; rowIndex: number; columnIndex: number} {
    const tableIndex = this.tables$.value.findIndex(table => table.id === cell.tableId);
    const tableByIndex = this.tables$.value[tableIndex];
    const columnIndex = tableByIndex?.columns.findIndex(column => column.id === cell.columnId);
    const rowIndex = tableByIndex?.rows.findIndex(row => row.id === cell.rowId);
    return {tableIndex, columnIndex, rowIndex};
  }

  private isEditing(): boolean {
    return isNotNullOrUndefined(this.editedCell$.value);
  }

  private isEditingCell(cell: TableCell): boolean {
    return this.isEditing() && this.cellsAreSame(cell, this.editedCell$.value);
  }

  private isSelected(): boolean {
    return isNotNullOrUndefined(this.selectedCell$.value);
  }

  private cellsAreSame(c1: TableCell, c2: TableCell): boolean {
    return c1.type === c2.type && c1.tableId === c2.tableId && c1.columnId === c2.columnId && c1.rowId === c2.rowId;
  }

  private isCellSelected(cell: TableCell): boolean {
    return this.isEditing() && this.cellsAreSame(cell, this.selectedCell$.value);
  }

  public onCellClick(cell: TableCell) {
    this.selectedCell$.next({...cell});
    this.editedCell$.next(null);
  }

  public onCellDoubleClick(cell: TableCell) {
    this.selectedCell$.next(null);
    this.editedCell$.next({...cell, inputValue: null});
  }

  public onColumnResize(changedTable: TableModel, columnId: string, width: number) {
    const newTables = [...this.tables$.value];
    for (let i = 0; i < newTables.length; i++) {
      const table = newTables[i];
      if (table.collectionId === changedTable.collectionId) {
        const columnIndex = table.columns.findIndex(column => column.id === columnId);

        if (columnIndex !== -1) {
          const columns = [...table.columns];
          columns[columnIndex] = {...table.columns[columnIndex], width};
          newTables[i] = {...table, columns};
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
    const columns = this.createCollectionColumns(currentTable?.columns || [], collection, permissions, query, settings);
    const rows = this.createDocumentRows(currentTable?.rows || [], documents);
    return {id: currentTable?.id || generateId(), columns, rows, collectionId: collection.id};
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
    const rowsMap = currentRows.reduce((map, row) => ({...map, [row.correlationId || row.documentId]: row}), {});

    return documents.map(document => {
      const currentRow = rowsMap[document.correlationId || document.id];
      return {
        id: currentRow?.id || generateId(),
        documentData: document.data,
        documentId: document.id,
        height: currentRow?.height || TABLE_ROW_HEIGHT,
        correlationId: document.correlationId,
      };
    });
  }
}
