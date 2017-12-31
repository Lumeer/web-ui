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

const ATTRIBUTE_COLUMN = 0;

const VALUE_COLUMN = 1;

const COLUMNS = 1;

export class SelectionManager {

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

  public setEditMode(on: boolean): void {
    this.selection.editing = on;
  }

  public selectNext(postIt: PostItDocumentModel): void {
    this.selectedPostIt = postIt;

    switch (this.selection.column) {
      case ATTRIBUTE_COLUMN:
        this.selectNextToTheRight();
        break;
      case VALUE_COLUMN:
        this.selectNextOnNewLine();
        break;
      default:
        throw new LumeerError('Currently selected nonexistant column');
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

  private selectedDocumentDirection(newColumn: number, newRow: number): Direction {
    if (newColumn < 0) {
      return Direction.Left;
    }
    if (newColumn > COLUMNS || this.leftOfDisabledInput(newColumn, newRow)) {
      return Direction.Right;
    }
    if (newRow < 0) {
      return Direction.Up;
    }
    if (newRow > this.lastRow() || this.aboveDisabledInput(newColumn, newRow)) {
      return Direction.Down;
    }

    return Direction.Self;
  }

  private selectDocumentByDirection(column: number, row: number, direction: Direction): void {
    this.selection.column = column;
    this.selection.row = row;

    switch (direction) {
      case Direction.Left:
        this.tryToSelectDocumentOnLeft();
        break;
      case Direction.Right:
        this.tryToSelectDocumentOnRight();
        break;
      case Direction.Up:
        this.tryToSelectDocumentOnUp();
        break;
      case Direction.Down:
        this.tryToSelectDocumentOnDown();
        break;
    }
  }

  private tryToSelectDocumentOnLeft(): void {
    if (this.selection.documentIndex - 1 >= 0) {
      const selectedDocument = this.postIts[this.selection.documentIndex - 1];
      this.select(Number.MAX_SAFE_INTEGER, this.selection.row, selectedDocument);
    }
  }

  private tryToSelectDocumentOnRight(): void {
    if (this.selection.documentIndex + 1 < this.postIts.length) {
      const selectedDocument = this.postIts[this.selection.documentIndex + 1];
      this.select(0, this.selection.row, selectedDocument);
    }
  }

  private tryToSelectDocumentOnUp(): void {
    if (this.selection.documentIndex - this.getDocumentsPerRow() >= 0) {
      const selectedDocument = this.postIts[this.selection.documentIndex - this.getDocumentsPerRow()];
      this.select(this.selection.column, Number.MAX_SAFE_INTEGER, selectedDocument);
    }
  }

  private tryToSelectDocumentOnDown(): void {
    if (this.selection.documentIndex + this.getDocumentsPerRow() < this.postIts.length) {
      const selectedDocument = this.postIts[this.selection.documentIndex + this.getDocumentsPerRow()];
      this.select(this.selection.column, 0, selectedDocument);
    }
  }

  public select(column: number, row: number, postIt: PostItDocumentModel): void {
    this.selectedPostIt = postIt;

    this.selection.documentId = postIt.documentModel.id;
    this.selection.documentIndex = postIt.index;
    this.selectRow(column, row);
    this.selectColumn(column, row);

    this.focus();
  }

  private selectRow(column: number, row: number): void {
    this.selection.row = Math.max(0, Math.min(row, this.lastRow()));

    if (row === this.lastRow() && column === VALUE_COLUMN) {
      this.selection.row--;
    }
  }

  private selectColumn(column: number, row: number): void {
    this.selection.column = Math.max(0, Math.min(column, COLUMNS));
  }

  public focus(): void {
    if (isNullOrUndefined(this.selection.column) || isNullOrUndefined(this.selection.row)) {
      throw new LumeerError('Focusing empty selection');
    }

    let elementToFocus = document.getElementById(this.selectedInputId());

    if (this.selection.editing) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLInputElement;
    }

    elementToFocus.focus();
  }

  private selectedInputId(): string {
    return `${ this.perspectiveId }${ this.selection.documentIndex }[${ this.selection.column }, ${ this.selection.row }]`;
  }

  private leftOfDisabledInput(column: number, row: number): boolean {
    return column === ATTRIBUTE_COLUMN && row === this.lastRow();
  }

  private aboveDisabledInput(column: number, row: number): boolean {
    return column === VALUE_COLUMN && row === this.lastRow() - 1;
  }

  private lastRow(): number {
    return Object.keys(this.selectedPostIt.documentModel.data).length;
  }

  public wasPreviouslySelected(column: number, row: number, postItId: string): boolean {
    return column === this.selection.column &&
      row === this.selection.row &&
      postItId === this.selection.documentId;
  }

}
