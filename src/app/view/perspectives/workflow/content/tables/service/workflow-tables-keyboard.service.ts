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
import {WorkflowTablesStateService} from './workflow-tables-state.service';
import {keyboardEventCode, KeyCode} from '../../../../../../shared/key-code';
import {preventEvent} from '../../../../../../shared/utils/common.utils';
import {TableCell, TableCellType, TableModel} from '../../../../../../shared/table/model/table-model';
import {WorkflowTablesDataService} from './workflow-tables-data.service';

@Injectable()
export class WorkflowTablesKeyboardService {
  constructor(
    private stateService: WorkflowTablesStateService,
    private dataService: WorkflowTablesDataService
  ) {}

  private get tables(): TableModel[] {
    return this.stateService.tables;
  }

  public onKeyDown(event: KeyboardEvent) {
    if (!this.shouldHandleKeyDown()) {
      return;
    }
    switch (keyboardEventCode(event)) {
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

    this.onShortcutKeyDown(event);
  }

  private shouldHandleKeyDown(): boolean {
    return !this.overlayOpened();
  }

  private overlayOpened(): boolean {
    const overlayContainer = document.body.getElementsByClassName('cdk-overlay-container');
    return overlayContainer.length > 0 && overlayContainer.item(0).hasChildNodes();
  }

  private onBackSpaceKeyDown(event: KeyboardEvent) {
    if (!this.isSelected()) {
      return;
    }

    preventEvent(event);

    const selectedCell = this.stateService.selectedCell;
    const column = this.stateService.findTableColumn(selectedCell.tableId, selectedCell.columnId);
    if (!column.attribute?.constraint?.isDirectlyEditable) {
      this.stateService.setEditedCell(this.stateService.selectedCell, '');
    }
  }

  private onF2KeyDown(event: KeyboardEvent) {
    if (this.isSelected()) {
      this.stateService.setEditedCell(this.stateService.selectedCell);
    } else if (this.isEditing()) {
      this.stateService.setSelectedCell(this.stateService.editedCell);
    }
  }

  private onEnterKeyDown(event: KeyboardEvent) {
    if (this.isEditing()) {
      preventEvent(event);
      if (this.stateService.editedCell.type === TableCellType.Body) {
        this.stateService.moveSelectionDownFromEdited();
      } else {
        this.stateService.setSelectedCell(this.stateService.editedCell);
      }
    } else if (this.isSelected()) {
      preventEvent(event);
      this.stateService.setEditedCell(this.stateService.selectedCell);
    }
  }

  private onTabKeyDown(event: KeyboardEvent) {
    if (this.isEditing()) {
      preventEvent(event);
      this.handleArrowKeyDown(event, this.stateService.editedCell);
      this.stateService.resetEditedCell();
    } else if (this.isSelected()) {
      preventEvent(event);
      this.onArrowKeyDown(event);
    }
  }

  private onArrowKeyDown(event: KeyboardEvent) {
    if (
      this.isEditing() ||
      !this.isSelected() ||
      (event.shiftKey && keyboardEventCode(event) !== KeyCode.Tab) ||
      event.altKey ||
      event.ctrlKey
    ) {
      return;
    }
    this.handleArrowKeyDown(event, this.stateService.selectedCell);
  }

  private handleArrowKeyDown(event: KeyboardEvent, cell: TableCell) {
    preventEvent(event);

    const {tableIndex, rowIndex, columnIndex} = this.stateService.getCellIndexes(cell);
    const table = this.tables[tableIndex];
    if (!table) {
      return;
    }

    const arrowLeftIndex = firstNonHiddenColumnIndex(table, 0, columnIndex - 1, true);
    const arrowRightIndex = firstNonHiddenColumnIndex(table, columnIndex + 1, table.columns.length);
    switch (keyboardEventCode(event)) {
      case KeyCode.ArrowUp:
        this.onArrowUp(cell.type, tableIndex, columnIndex, rowIndex);
        break;
      case KeyCode.ArrowDown:
        this.onArrowDown(cell.type, tableIndex, columnIndex, rowIndex);
        break;
      case KeyCode.ArrowLeft:
        this.stateService.selectCell(tableIndex, rowIndex, arrowLeftIndex, cell.type);
        break;
      case KeyCode.ArrowRight:
        this.stateService.selectCell(tableIndex, rowIndex, arrowRightIndex, cell.type);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.stateService.selectCell(tableIndex, rowIndex, arrowLeftIndex, cell.type);
        } else {
          this.stateService.selectCell(tableIndex, rowIndex, arrowRightIndex, cell.type);
        }
        break;
    }
  }

  private onArrowUp(type: TableCellType, tableIndex: number, columnIndex: number, rowIndex: number) {
    switch (type) {
      case TableCellType.Body:
        if (rowIndex === 0) {
          // selecting header
          this.stateService.selectCell(tableIndex, null, columnIndex, TableCellType.Header);
        } else {
          // selecting row above current
          this.stateService.selectCell(tableIndex, rowIndex - 1, columnIndex);
        }
        break;
      case TableCellType.Header:
        if (tableIndex > 0) {
          const nextTableIndex = tableIndex - 1;
          if (this.numberOfVisibleRowsInTable(nextTableIndex) > 0) {
            // selecting last row in previous table
            const nextRowIndex = this.numberOfVisibleRowsInTable(nextTableIndex) - 1;
            const nextColumnIndex = Math.min(columnIndex, this.numberOfVisibleColumnsInTable(nextTableIndex) - 1);
            this.stateService.selectCell(nextTableIndex, nextRowIndex, nextColumnIndex);
          } else {
            // selecting header in previous table
            this.stateService.selectCell(nextTableIndex, null, columnIndex, TableCellType.Header);
          }
        }
        break;
    }
  }

  private onArrowDown(type: TableCellType, tableIndex: number, columnIndex: number, rowIndex: number) {
    switch (type) {
      case TableCellType.Body:
        if (this.numberOfVisibleRowsInTable(tableIndex) - 1 === rowIndex) {
          const nextTableIndex = tableIndex + 1;
          const nextColumnIndex = Math.min(columnIndex, this.numberOfVisibleColumnsInTable(nextTableIndex) - 1);
          this.stateService.selectCell(nextTableIndex, null, nextColumnIndex, TableCellType.Header);
        } else {
          this.stateService.selectCell(tableIndex, rowIndex + 1, columnIndex);
        }
        break;
      case TableCellType.Header:
        if (this.numberOfVisibleRowsInTable(tableIndex) > 0) {
          this.stateService.selectCell(tableIndex, 0, columnIndex);
        } else {
          this.stateService.selectCell(tableIndex + 1, null, columnIndex, TableCellType.Header);
        }
        break;
    }
  }

  private onShortcutKeyDown(event: KeyboardEvent) {
    if (!this.isSelected()) {
      return;
    }

    const cell = this.stateService.selectedCell;
    const row = this.stateService.findTableRow(cell.tableId, cell.rowId);

    if (event.altKey && event.shiftKey) {
      switch (keyboardEventCode(event)) {
        case KeyCode.ArrowRight:
          this.dataService.indentRow(row);
          return;
        case KeyCode.ArrowLeft:
          this.dataService.outdentRow(row);
          return;
      }
    }
  }

  private numberOfVisibleRowsInTable(tableIndex: number): number {
    return this.stateService.numberOfVisibleRowsInTable(tableIndex);
  }

  private numberOfVisibleColumnsInTable(tableIndex: number): number {
    return this.stateService.numberOfVisibleColumnsInTable(tableIndex);
  }

  private isEditing(): boolean {
    return this.stateService.isEditing();
  }

  private isSelected(): boolean {
    return this.stateService.isSelected();
  }
}

function firstNonHiddenColumnIndex(table: TableModel, from: number, to: number, fromEnd?: boolean): number {
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
