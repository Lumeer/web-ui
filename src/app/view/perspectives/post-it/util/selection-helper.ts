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

import {isNullOrUndefined} from 'util';
import {LumeerError} from '../../../../core/error/lumeer.error';
import {AttributePropertySelection} from '../document-data/attribute-property-selection';
import {Direction} from '../document-data/direction';
import {PostItDocumentModel} from '../document-data/post-it-document-model';

export const ATTRIBUTE_COLUMN = 0;

export const VALUE_COLUMN = 1;

export const COLUMNS = 1;

export class SelectionHelper {

  public selection: AttributePropertySelection = this.emptySelection();

  public selectedPostIt: PostItDocumentModel;

  constructor(private postIts: PostItDocumentModel[],
              private getDocumentsPerRow: () => number,
              private perspectiveId: string) {
  }

  private emptySelection(): AttributePropertySelection {
    return {
      row: null,
      column: null,
      documentId: null,
      documentIndex: null,
      editing: false
    };
  }

  public initializeIfNeeded() {
    if (this.selectionIsEmpty()) {
      this.select(0, 0, this.firstPostIt());
    }
  }

  private firstPostIt(): PostItDocumentModel {
    return this.postIts.reduce((first, current) => {
      if (first.order <= current.order) {
        return first;
      } else {
        return current;
      }
    });
  }

  private selectionIsEmpty(): boolean {
    return JSON.stringify(this.selection) === JSON.stringify(this.emptySelection());
  }

  public setEditMode(on: boolean): void {
    this.selection.editing = on;
  }

  public selectNext(postIt: PostItDocumentModel, currentRows?: number): void {
    this.selectedPostIt = postIt;

    switch (this.selection.column) {
      case ATTRIBUTE_COLUMN:
        this.selectNextToTheRight();
        break;
      case VALUE_COLUMN:
        this.selectNextOnNewLine();
        break;
      default:
        throw new LumeerError('Currently selected nonexistent column');
    }
  }

  private selectNextToTheRight(): void {
    if (this.selection.row === this.lastRow()) {
      this.moveSelection(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
    } else {
      this.moveSelection(1, 0);
    }
  }

  private selectNextOnNewLine(): void {
    if (this.selection.row === this.lastRow()) {
      this.moveSelection(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
    } else {
      this.moveSelection(-1, 1);
    }
  }

  public moveSelection(columnChange: number, rowChange: number): void {
    const newColumn = this.selection.column + columnChange;
    const newRow = this.selection.row + rowChange;
    const newDirection = this.selectedDocumentDirection(newColumn, newRow);

    if (newDirection === Direction.Self) {
      this.select(newColumn, newRow, this.selectedPostIt);
    } else {
      this.selectDocumentByDirection(newColumn, newRow, newDirection);
    }
  }

  public select(column: number, row: number, postIt: PostItDocumentModel): void {
    this.selectedPostIt = postIt;

    this.selection.documentId = postIt.document && postIt.document.id;
    this.selection.documentIndex = postIt.index;
    this.selectRow(row);
    this.selectColumn(column);

    this.handleBoundarySelections();

    this.focus();
  }

  private selectedDocumentDirection(newColumn: number, newRow: number): Direction {
    if (newColumn < 0) {
      return Direction.Left;
    }
    if (newColumn > COLUMNS || this.leftOfDisabledInput() && newColumn === VALUE_COLUMN) {
      return Direction.Right;
    }
    if (newRow < 0) {
      return Direction.Up;
    }
    if (newRow > this.lastRow() || this.aboveDisabledInput() && newRow === this.lastRow() && newColumn !== ATTRIBUTE_COLUMN) {
      return Direction.Down;
    }

    return Direction.Self;
  }

  private selectDocumentByDirection(newColumn: number, newRow: number, direction: Direction): void {
    switch (direction) {
      case Direction.Left:
        this.tryToSelectDocumentOnLeft(newColumn, newRow);
        break;
      case Direction.Right:
        this.tryToSelectDocumentOnRight(newColumn, newRow);
        break;
      case Direction.Up:
        this.tryToSelectDocumentOnUp(newColumn, newRow);
        break;
      case Direction.Down:
        this.tryToSelectDocumentOnDown(newColumn, newRow);
        break;
    }
  }

  private tryToSelectDocumentOnLeft(newColumn: number, newRow: number): void {
    newColumn = VALUE_COLUMN;
    newRow = newRow > this.lastRow() ? 0 : newRow;

    if (this.selection.documentIndex - 1 >= 0) {
      const selectedDocument = this.postIts[this.selection.documentIndex - 1];
      this.select(newColumn, newRow, selectedDocument);
    }
  }

  private tryToSelectDocumentOnRight(newColumn: number, newRow: number): void {
    newColumn = ATTRIBUTE_COLUMN;

    if (this.selection.documentIndex + 1 < this.postIts.length) {
      const selectedDocument = this.postIts[this.selection.documentIndex + 1];
      this.select(newColumn, newRow, selectedDocument);
    }
  }

  private tryToSelectDocumentOnUp(newColumn: number, newRow: number): void {
    if (this.selection.documentIndex - this.getDocumentsPerRow() >= 0) {
      const selectedDocument = this.postIts[this.selection.documentIndex - this.getDocumentsPerRow()];
      this.select(newColumn, newRow, selectedDocument);
    }
  }

  private tryToSelectDocumentOnDown(newColumn: number, newRow: number): void {
    newRow = 0;

    if (this.selection.documentIndex + this.getDocumentsPerRow() < this.postIts.length) {
      const selectedDocument = this.postIts[this.selection.documentIndex + this.getDocumentsPerRow()];
      this.select(newColumn, newRow, selectedDocument);
    }
  }

  private selectRow(row: number): void {
    if (row < 0) {
      row = 0;
    }

    if (row > this.lastRow()) {
      row = this.lastRow();
    }

    this.selection.row = row;
  }

  private selectColumn(column: number): void {
    if (column > COLUMNS) {
      column = ATTRIBUTE_COLUMN;
    }

    if (column < 0) {
      column = VALUE_COLUMN;
    }

    this.selection.column = column;
  }

  private handleBoundarySelections(): void {
    if (this.lastRow() === 0 && this.selection.column === VALUE_COLUMN) {
      this.selection.column = ATTRIBUTE_COLUMN;
      return;
    }

    if (this.selection.row === this.lastRow() && this.selection.column === VALUE_COLUMN) {
      this.selection.row--;
      return;
    }
  }

  public focus(): void {
    if (isNullOrUndefined(this.selection.column) || isNullOrUndefined(this.selection.row)) {
      throw new LumeerError('Focusing empty selection');
    }

    let elementToFocus = document.getElementById(this.selectedInputId());

    if (elementToFocus && this.selection.editing) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLInputElement;
    }

    if (elementToFocus) {
      elementToFocus.focus();
    }
  }

  private selectedInputId(): string {
    return `${ this.perspectiveId }${ this.selection.documentIndex }[${ this.selection.column }, ${ this.selection.row }]`;
  }

  private leftOfDisabledInput(): boolean {
    return this.selection.column === ATTRIBUTE_COLUMN &&
      this.selection.row === this.lastRow();
  }

  private aboveDisabledInput(): boolean {
    return this.selection.column === VALUE_COLUMN &&
      this.selection.row === this.lastRow() - 1;
  }

  private lastRow(): number {
    return this.selectedPostIt.numRows || Object.keys(this.selectedPostIt.document.data).length;
  }

}
