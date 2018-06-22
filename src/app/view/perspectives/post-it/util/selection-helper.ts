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
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {DocumentUiService} from '../../../../core/ui/document-ui.service';
import {CollectionModel} from '../../../../core/store/collections/collection.model';

export const ATTRIBUTE_COLUMN = 0;

export const VALUE_COLUMN = 1;

export class SelectionHelper {

  private selection: AttributePropertySelection = this.emptySelection();

  private selectedPostIt: PostItDocumentModel;

  constructor(private postIts: () => PostItDocumentModel[],
              private collections: () => { [collectionId: string]: CollectionModel },
              private documentsPerRow: () => number,
              private documentUiService: DocumentUiService,
              private perspectiveId: string) {
  }

  public initializeIfNeeded() {
    if (this.isEmptySelection()) {
      this.tryToSelectSpanCell(0, 0, 0);
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
    } else { // now we need select document above
      const index = this.selection.index - this.documentsPerRow();
      const postIt = this.getDocumentByIndex(index);
      if (postIt) {
        this.focusCellSpan(this.lastRowIndex(postIt), column, postIt);
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
    } else { // now we need select document below
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
    } else { // we need to select document on right
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
    } else { // we need to select document on left
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
      this.focus(row, column, this.selectedPostIt, true);
    } else { // now we need select document below
      const index = this.selection.index + 1;
      const postIt = this.getDocumentByIndex(index);
      if (postIt) {
        this.focus(0, column, postIt, true);
      }
    }
  }

  public focusToggle(input: boolean) {
    if (this.isEmptySelection()) {
      return;
    }

    this.focus(this.selection.row, this.selection.column, this.selectedPostIt, input);
  }

  private tryToSelectSpanCell(row: number, column: number, index: number) {
    const postIt = this.getDocumentByIndex(index);
    if (postIt) {
      this.focusCellSpan(row, column, postIt);
    }
  }

  private getDocumentByIndex(index: number): PostItDocumentModel {
    return this.postIts().find(doc => doc.order === index);
  }

  private focusCurrent(row: number, column: number) {
    this.focusCellSpan(row, column, this.selectedPostIt);
  }

  public focusCellSpan(row: number, column: number, postIt: PostItDocumentModel) {
    this.focus(row, column, postIt, false);
  }

  private focus(row: number, column: number, postIt: PostItDocumentModel, input: boolean) {
    const cellId = this.getCellId(row, column, postIt.order);

    let elementToFocus = document.getElementById(cellId);

    if (input && elementToFocus) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLInputElement;
    }

    if (elementToFocus) {
      elementToFocus.focus();

      this.selection.row = row;
      this.selection.column = column;
      this.selection.index = postIt.order;
      this.selectedPostIt = postIt;
    }
  }

  private getCellId(row: number, column: number, index: number): string {
    console.log('getCellId', index, column, row);
    return `${ this.perspectiveId }${index}[${column}, ${row}]`;
  }

  private isEmptySelection(): boolean {
    return JSON.stringify(this.selection) === JSON.stringify(this.emptySelection());
  }

  private currentLastRowIndex(): number {
    return this.lastRowIndex(this.selectedPostIt);
  }

  private lastRowIndex(postIt: PostItDocumentModel): number {
    const collection = this.collections()[postIt.document.collectionId];
    return this.documentUiService.getRows$(collection, postIt.document).getValue().length - 1;
  }

  private emptySelection(): AttributePropertySelection {
    return {row: null, column: null, index: null};
  }

}
