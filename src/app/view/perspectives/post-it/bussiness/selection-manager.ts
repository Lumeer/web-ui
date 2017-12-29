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

import {QueryList} from '@angular/core';
import {AttributePropertySelection} from '../document-data/attribute-property-selection';
import {Direction} from '../document-data/direction';
import {PostItDocumentModel} from '../document-data/post-it-document-model';
import {PostItDocumentComponent} from '../document/post-it-document.component';

export class SelectionManager {

  constructor(
    private postIts: PostItDocumentModel[],
    private postItComponents: QueryList<PostItDocumentComponent>,
    private getDocumentsPerRow: () => number) {
  }

  public selectedAttributeProperty(): AttributePropertySelection {
    return this.postIts[0] ? this.postIts[0].selectedInput : this.emptySelection();
  }

  private emptySelection(): AttributePropertySelection {
    return {
      row: null,
      column: null,
      documentIdx: null,
      direction: Direction.Self,
      editing: false
    };
  }

  public selectDocument(selection: AttributePropertySelection): void {
    switch (selection.direction) {
      case Direction.Left:
        this.tryToSelectDocumentOnLeft(selection);
        break;
      case Direction.Right:
        this.tryToSelectDocumentOnRight(selection);
        break;
      case Direction.Up:
        this.tryToSelectDocumentOnUp(selection);
        break;
      case Direction.Down:
        this.tryToSelectDocumentOnDown(selection);
        break;
    }
  }

  private tryToSelectDocumentOnLeft(selection: AttributePropertySelection): void {
    if (selection.documentIdx - 1 >= 0) {
      const selectedDocument = this.postItComponents.toArray()[selection.documentIdx - 1];
      selectedDocument.select(Number.MAX_SAFE_INTEGER, selection.row);
    }
  }

  private tryToSelectDocumentOnRight(selection: AttributePropertySelection): void {
    if (selection.documentIdx + 1 < this.postIts.length) {
      const selectedDocument = this.postItComponents.toArray()[selection.documentIdx + 1];
      selectedDocument.select(0, selection.row);
    }
  }

  private tryToSelectDocumentOnUp(selection: AttributePropertySelection): void {
    if (selection.documentIdx - this.getDocumentsPerRow() >= 0) {
      const selectedDocument = this.postItComponents.toArray()[selection.documentIdx - this.getDocumentsPerRow()];
      selectedDocument.select(selection.column, Number.MAX_SAFE_INTEGER);
    }
  }

  private tryToSelectDocumentOnDown(selection: AttributePropertySelection): void {
    if (selection.documentIdx + this.getDocumentsPerRow() < this.postIts.length) {
      const selectedDocument = this.postItComponents.toArray()[selection.documentIdx + this.getDocumentsPerRow()];
      selectedDocument.select(selection.column, 0);
    }
  }

}
