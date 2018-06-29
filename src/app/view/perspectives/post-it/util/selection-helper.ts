/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {AttributePropertySelection} from '../document-data/attribute-property-selection';

export const ATTRIBUTE_COLUMN = 0;

export const VALUE_COLUMN = 1;

export class SelectionHelper {

  private selection: AttributePropertySelection = this.emptySelection();

  constructor(private postItsOrder: () => string[],
              private getDocumentNumRows: (string) => number,
              private documentsPerRow: () => number,
              private perspectiveId: string) {
  }

  public initializeIfNeeded() {
    if (this.isEmptySelection()) {
      this.tryToSelectSpanCell(0, VALUE_COLUMN, 0);
    }
  }

  public moveUp() {
    if (this.isEmptySelection()) {
      return;
    }

    const row = this.selection.row - 1;
    const column = this.selection.column;

    if (row >= 0) {
      this.focusCurrent(row, column);
    } else { // now we need select post-it above
      const index = this.selection.index - this.documentsPerRow();
      if (index >= 0) {
        const key = this.postItsOrder()[index];
        this.focusCellSpan(this.getDocumentNumRows(key), column, key);
      }
    }

  }

  public moveDown() {
    if (this.isEmptySelection()) {
      return;
    }

    const row = this.selection.row + 1;
    const column = this.selection.column;

    if (row <= this.currentLastRowIndex()) {
      this.focusCurrent(row, column);
    } else { // now we need select post-it below
      const index = this.selection.index + this.documentsPerRow();
      this.tryToSelectSpanCell(0, column, index);
    }
  }

  public moveRight() {
    if (this.isEmptySelection()) {
      return;
    }

    const row = this.selection.row;
    const column = this.selection.column + 1;

    if (column <= VALUE_COLUMN) {
      this.focusCurrent(row, column);
    } else { // we need to select post-it on the right
      const index = this.selection.index + 1;
      this.tryToSelectSpanCell(row, ATTRIBUTE_COLUMN, index);
    }
  }

  public moveLeft() {
    if (this.isEmptySelection()) {
      return;
    }

    const row = this.selection.row;
    const column = this.selection.column - 1;

    if (column >= ATTRIBUTE_COLUMN) {
      this.focusCurrent(row, column);
    } else { // we need to select post-it on the left
      const index = this.selection.index - 1;
      this.tryToSelectSpanCell(row, VALUE_COLUMN, index);
    }
  }

  public moveToNextInput() {
    if (this.isEmptySelection()) {
      return;
    }

    let column = this.selection.column + 1;
    let row = this.selection.row;
    if (column > VALUE_COLUMN) {
      column = ATTRIBUTE_COLUMN;
      row += 1;
    }

    if (row <= this.currentLastRowIndex()) {
      this.focus(row, column, this.selection.key, true);
    } else { // now we need select post-it below
      const index = this.selection.index + 1;
      if (index < this.postItsOrder().length) {
        this.focus(0, ATTRIBUTE_COLUMN, this.postItsOrder()[index], true);
      }
    }
  }

  public focusToggle(input: boolean) {
    if (this.isEmptySelection()) {
      return;
    }

    this.focus(this.selection.row, this.selection.column, this.selection.key, input);
  }

  private tryToSelectSpanCell(row: number, column: number, index: number) {
    if (index >= 0 && index < this.postItsOrder().length) {
      this.focusCellSpan(row, column, this.postItsOrder()[index]);
    }
  }

  private focusCurrent(row: number, column: number) {
    this.focusCellSpan(row, column, this.selection.key);
  }

  public focusCellSpan(row: number, column: number, key: string) {
    this.focus(row, column, key, false);
  }

  public focusInputIfNeeded(key: string) {
    if (this.selection.key != key) {
      this.focus(0, VALUE_COLUMN, key, true);
    }
  }

  private focus(row: number, column: number, key: string, input: boolean) {
    const cellId = this.getCellId(row, column, key);

    let elementToFocus = document.getElementById(cellId);

    if (input && elementToFocus) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLElement;
    }

    // console.log(elementToFocus.getBoundingClientRect());

    if (elementToFocus) {
      elementToFocus.focus();

      this.selection.row = row;
      this.selection.column = column;
      this.selection.index = this.postItsOrder().findIndex(ord => ord === key);
      this.selection.key = key;
    }
  }

  private getCellId(row: number, column: number, key: string): string {
    return `${ this.perspectiveId }${key}[${column}, ${row}]`;
  }

  private isEmptySelection(): boolean {
    return JSON.stringify(this.selection) === JSON.stringify(this.emptySelection());
  }

  private currentLastRowIndex(): number {
    return this.getDocumentNumRows(this.selection.key);
  }

  private emptySelection(): AttributePropertySelection {
    return {row: null, column: null, index: null, key: null};
  }

}
