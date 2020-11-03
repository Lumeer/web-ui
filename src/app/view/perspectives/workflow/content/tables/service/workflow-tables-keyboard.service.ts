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
import {KeyCode} from '../../../../../../shared/key-code';
import {preventEvent} from '../../../../../../shared/utils/common.utils';
import {TableCellType, TableModel} from '../../../../../../shared/table/model/table-model';

@Injectable()
export class WorkflowTablesKeyboardService {
  constructor(private stateService: WorkflowTablesStateService) {}

  private get tables(): TableModel[] {
    return this.stateService.tables;
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

    this.stateService.setEditedCell(this.stateService.selectedCell, '');
  }

  private onF2KeyDown(event: KeyboardEvent) {
    if (this.isSelected()) {
      this.stateService.setEditedCell(this.stateService.selectedCell);
    } else if (this.isEditing()) {
      this.stateService.setSelectedCell(this.stateService.editedCell);
    }
  }

  private onEnterKeyDown(event: KeyboardEvent) {
    preventEvent(event);

    if (this.isEditing()) {
      if (this.stateService.editedCell.type === TableCellType.Body) {
        this.stateService.moveSelectionDownFromEdited();
      } else {
        this.stateService.setSelectedCell(this.stateService.editedCell);
      }
    } else if (this.isSelected()) {
      this.stateService.setEditedCell(this.stateService.selectedCell);
    }
  }

  private onTabKeyDown(event: KeyboardEvent) {
    preventEvent(event);

    if (this.isEditing()) {
      const {tableIndex, rowIndex, columnIndex, type} = this.stateService.getCellIndexes(this.stateService.editedCell);
      if (event.shiftKey) {
        this.stateService.selectCell(tableIndex, rowIndex, columnIndex - 1, type);
      } else {
        this.stateService.selectCell(tableIndex, rowIndex, columnIndex + 1, type);
      }
      this.stateService.resetEditedCell();
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

    switch (this.stateService.selectedCell.type) {
      case TableCellType.Header:
        this.onArrowKeyDownInHeader(event);
        break;
      case TableCellType.Body:
        this.onArrowKeyDownInBody(event);
        break;
    }
  }

  private onArrowKeyDownInHeader(event: KeyboardEvent) {
    const {tableIndex, columnIndex} = this.stateService.getCellIndexes(this.stateService.selectedCell);
    const table = this.tables[tableIndex];
    const arrowLeftIndex = firstNonHiddenColumnIndex(table, 0, columnIndex - 1, true);
    const arrowRightIndex = firstNonHiddenColumnIndex(table, columnIndex + 1, table.columns.length);
    switch (event.code) {
      case KeyCode.ArrowUp:
        if (tableIndex > 0) {
          const nextTableIndex = tableIndex - 1;
          const nextRowIndex = this.numberOfRowsInTable(nextTableIndex) - 1;
          const nextColumnIndex = Math.min(columnIndex, this.numberOfColumnsInTable(nextTableIndex) - 1);
          this.stateService.selectCell(nextTableIndex, nextRowIndex, nextColumnIndex);
        }
        break;
      case KeyCode.ArrowDown:
        this.stateService.selectCell(tableIndex, 0, columnIndex);
        break;
      case KeyCode.ArrowLeft:
        this.stateService.selectCell(tableIndex, null, arrowLeftIndex, TableCellType.Header);
        break;
      case KeyCode.ArrowRight:
        this.stateService.selectCell(tableIndex, null, arrowRightIndex, TableCellType.Header);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.stateService.selectCell(tableIndex, null, arrowLeftIndex, TableCellType.Header);
        } else {
          this.stateService.selectCell(tableIndex, null, arrowRightIndex, TableCellType.Header);
        }
        break;
    }
  }

  private numberOfRowsInTable(tableIndex: number): number {
    return this.tables[tableIndex]?.rows?.length || 0;
  }

  private numberOfColumnsInTable(tableIndex: number): number {
    return this.tables[tableIndex]?.columns?.length || 0;
  }

  private onArrowKeyDownInBody(event: KeyboardEvent) {
    const {tableIndex, rowIndex, columnIndex} = this.stateService.getCellIndexes(this.stateService.selectedCell);
    const table = this.tables[tableIndex];
    const arrowLeftIndex = firstNonHiddenColumnIndex(table, 0, columnIndex - 1, true);
    const arrowRightIndex = firstNonHiddenColumnIndex(table, columnIndex + 1, table.columns.length);
    switch (event.code) {
      case KeyCode.ArrowUp:
        if (rowIndex === 0) {
          this.stateService.selectCell(tableIndex, null, columnIndex, TableCellType.Header);
        } else {
          this.stateService.selectCell(tableIndex, rowIndex - 1, columnIndex);
        }
        break;
      case KeyCode.ArrowDown:
        if (this.numberOfRowsInTable(tableIndex) - 1 === rowIndex) {
          const nextTableIndex = tableIndex + 1;
          const nextColumnIndex = Math.min(columnIndex, this.numberOfColumnsInTable(nextTableIndex) - 1);
          this.stateService.selectCell(nextTableIndex, null, nextColumnIndex, TableCellType.Header);
        } else {
          this.stateService.selectCell(tableIndex, rowIndex + 1, columnIndex);
        }
        break;
      case KeyCode.ArrowLeft:
        this.stateService.selectCell(tableIndex, rowIndex, arrowLeftIndex);
        break;
      case KeyCode.ArrowRight:
        this.stateService.selectCell(tableIndex, rowIndex, arrowRightIndex);
        break;
      case KeyCode.Tab:
        if (event.shiftKey) {
          this.stateService.selectCell(tableIndex, rowIndex, arrowLeftIndex);
        } else {
          this.stateService.selectCell(tableIndex, rowIndex, arrowRightIndex);
        }
        break;
    }
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
