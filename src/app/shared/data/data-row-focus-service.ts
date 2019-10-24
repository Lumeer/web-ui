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

import {isNotNullOrUndefined, isNullOrUndefined} from '../utils/common.utils';
import {KeyCode} from '../key-code';
import {DataRowComponent, DataRowHiddenComponent} from './data-row-component';

interface DataRowPosition {
  row?: number;
  column?: number;
}

export class DataRowFocusService {
  private focused: DataRowPosition = {};
  private edited: DataRowPosition = {};

  constructor(
    private numRows: () => number,
    private rows: () => DataRowComponent[],
    private hiddenComponent?: () => DataRowHiddenComponent
  ) {}

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
      case KeyCode.ArrowUp:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
        return this.onArrowKeyDown(event);
      case KeyCode.Tab:
        return this.onTabKeyDown(event);
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
        return this.onEnterKeyDown(event);
      case KeyCode.F2:
        return this.onF2KeyDown(event);
      case KeyCode.Backspace:
        return this.onBackSpaceKeyDown(event);
    }
  }

  public focus(row: number, column: number) {
    this.emitFocus(row, column);
    this.resetEdit();
  }

  private emitFocus(row: number, column: number) {
    if (isNullOrUndefined(row) || isNullOrUndefined(column)) {
      return;
    }

    this.focused = {row, column};
    this.rows().forEach((component, index) => {
      if (index === row) {
        component.focusKey(column === 0);
        component.focusValue(column === 1);
      } else {
        component.focusKey(false);
        component.focusValue(false);
      }
    });
    this.hiddenComponent() && this.hiddenComponent().focus();
  }

  public resetFocusAndEdit(row: number, column: number) {
    const component = this.rows()[row];
    if (!component) {
      return;
    }

    if (this.isEditing() && this.edited.row === row && this.edited.column === column) {
      this.edited = {};
      if (column === 0) {
        component.endKeyEditing();
      } else if (column === 1) {
        component.endValueEditing();
      }
    } else if (this.isFocusing() && this.focused.row === row && this.focused.column === column) {
      this.focused = {};
      if (column === 0) {
        component.focusKey(false);
      } else if (column === 1) {
        component.focusValue(false);
      }
    }
  }

  private resetFocus() {
    this.focused = {};
    this.rows().forEach(component => {
      component.focusKey(false);
      component.focusValue(false);
    });
  }

  private resetEdit() {
    this.edited = {};
    this.rows().forEach(component => {
      component.endKeyEditing();
      component.endValueEditing();
    });
  }

  public edit(row: number, column: number) {
    this.resetFocus();
    this.emitEdit(row, column);
  }

  private emitEdit(row: number, column: number, value?: any) {
    if (isNullOrUndefined(row) || isNullOrUndefined(column)) {
      return;
    }

    this.hiddenComponent() && this.hiddenComponent().blur();
    this.edited = {row, column};
    this.rows().forEach((component, index) => {
      if (index === row) {
        if (column === 0) {
          component.startKeyEditing(value);
          component.endValueEditing();
        } else if (column === 1) {
          component.endKeyEditing();
          component.startValueEditing(value);
        }
      } else {
        component.endKeyEditing();
        component.endValueEditing();
      }
    });
  }

  private onArrowKeyDown(event: KeyboardEvent) {
    if (this.isEditing() || !this.isFocusing() || event.shiftKey || event.altKey || event.ctrlKey) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const x = event.code === KeyCode.ArrowRight ? 1 : event.code === KeyCode.ArrowLeft ? -1 : 0;
    const y = event.code === KeyCode.ArrowUp ? -1 : event.code === KeyCode.ArrowDown ? 1 : 0;
    this.moveFocus(x, y);
  }

  private isFocusing(): boolean {
    return this.focused && isNotNullOrUndefined(this.focused.row) && isNotNullOrUndefined(this.focused.column);
  }

  private isEditing(): boolean {
    return this.edited && isNotNullOrUndefined(this.edited.row) && isNotNullOrUndefined(this.edited.column);
  }

  private moveFocus(x: number, y: number) {
    const {newRow, newColumn} = this.computeMoveOffset(x, y, this.focused);

    if (
      isNotNullOrUndefined(newRow) &&
      isNotNullOrUndefined(newColumn) &&
      (newRow !== this.focused.row || newColumn !== this.focused.column)
    ) {
      this.emitFocus(newRow, newColumn);
    }
  }

  private onTabKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isEditing()) {
      const {offsetX, offsetY} = this.computeTabKeyDownOffset(event, this.edited);
      this.focused = {...this.edited};
      this.resetEdit();
      this.moveFocus(offsetX, offsetY);
    } else if (this.isFocusing()) {
      const {offsetX, offsetY} = this.computeTabKeyDownOffset(event, this.focused);
      this.moveFocus(offsetX, offsetY);
    }
  }

  private computeTabKeyDownOffset(event: KeyboardEvent, position: DataRowPosition): {offsetX: number; offsetY: number} {
    const {column, row} = position;
    let offsetX = 0;
    let offsetY = 0;
    if (event.shiftKey) {
      offsetX = isNotNullOrUndefined(column) ? (column === 0 ? (row > 0 ? 1 : 0) : -1) : 0;
      offsetY = isNotNullOrUndefined(column) ? (column === 0 ? -1 : 0) : 0;
    } else {
      const maxRowIndex = this.numRows() - 1;
      offsetX = isNotNullOrUndefined(column) ? (column === 0 ? 1 : row < maxRowIndex ? -1 : 0) : 0;
      offsetY = isNotNullOrUndefined(column) ? (column === 0 ? 0 : 1) : 0;
    }
    return {offsetX, offsetY};
  }

  private computeMoveOffset(x: number, y: number, position: DataRowPosition): {newRow?: number; newColumn?: number} {
    const {row, column} = position;
    if (isNullOrUndefined(row) || isNullOrUndefined(column)) {
      return {};
    }

    const maxRowIndex = this.numRows() - 1;
    const maxColumnIndex = 1;

    const newRow = Math.max(0, Math.min(row + y, maxRowIndex));
    const newColumn = Math.max(0, Math.min(column + x, maxColumnIndex));
    return {newRow, newColumn};
  }

  private onEnterKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isEditing()) {
      const {newRow, newColumn} = this.computeMoveOffset(0, 1, this.edited);
      this.emitFocus(newRow, newColumn);
    } else if (this.isFocusing()) {
      this.emitEdit(this.focused.row, this.focused.column);
      this.resetFocus();
    }
  }

  private onF2KeyDown(event: KeyboardEvent) {
    if (this.isFocusing()) {
      this.emitEdit(this.focused.row, this.focused.column);
      this.resetFocus();
    } else if (this.isEditing()) {
      this.emitFocus(this.edited.row, this.edited.column);
      this.resetEdit();
    }
  }

  private onBackSpaceKeyDown(event: KeyboardEvent) {
    if (!this.isFocusing()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.emitEdit(this.focused.row, this.focused.column, '');
    this.resetFocus();
  }

  public newHiddenInput(value: string) {
    if (this.isFocusing()) {
      this.emitEdit(this.focused.row, this.focused.column, value);
      this.resetFocus();
    }
  }
}
