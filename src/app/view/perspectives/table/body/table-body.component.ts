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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TablePart, TableRow} from '../model';
import {DataChangeEvent, LinkInstanceEvent, TableCursorEvent} from '../event';
import {Direction} from '../../post-it/document-data/direction';
import {Attribute} from '../../../../core/dto';
import {TableManagerService} from '../util/table-manager.service';
import {Document} from '../../../../core/dto/document';

@Component({
  selector: 'table-body',
  templateUrl: './table-body.component.html',
  styleUrls: ['./table-body.component.scss']
})
export class TableBodyComponent {

  @Input()
  public parts: TablePart[] = [];

  @Input()
  public editable = false;

  @Output()
  public dataChange = new EventEmitter<DataChangeEvent>();

  @Output()
  public deleteDocument = new EventEmitter<Document>();

  @Output()
  public createLinkInstance = new EventEmitter<LinkInstanceEvent>();

  @Output()
  public deleteLinkInstance = new EventEmitter<string>();

  public selectedCell: { row: TableRow, attribute: Attribute };
  public editedCell: { row: TableRow, attribute: Attribute };

  constructor(private tableManagerService: TableManagerService) {
  }

  public rowOffsets(row: TableRow): number[] {
    return Array.from(new Array(row.countRows()).keys());
  }

  public findRowNumber(rows: TableRow[], rowNumber: number): TableRow {
    if (rows.length === 0) {
      return;
    }

    const part = rows.find(row => row.rowNumber() === rowNumber);
    if (part) {
      return part;
    }

    return this.findRowNumber([].concat.apply([], rows.map(row => row.nextLinkedRows)), rowNumber);
  }

  public onMoveCursor(event: TableCursorEvent) {
    switch (event.direction) {
      case Direction.Left:
        return this.moveCursorLeft(event.row, event.attribute);
      case Direction.Right:
        return this.moveCursorRight(event.row, event.attribute);
      case Direction.Up:
        return this.moveCursorUp(event.row, event.attribute);
      case Direction.Down:
        return this.moveCursorDown(event.row, event.attribute);
    }
  }

  private moveCursorLeft(row: TableRow, attribute: Attribute) {
    const index = row.part.shownAttributes.indexOf(attribute);

    if (index > 0) {
      const nextAttribute = row.part.shownAttributes[index - 1];
      return this.focusTableCell(row, nextAttribute);
    }

    if (row.previousLinkedRow) {
      const nextRow = row.previousLinkedRow;
      const shownAttributes = nextRow.part.shownAttributes;
      if (shownAttributes.length > 0) {
        const nextAttribute = shownAttributes[shownAttributes.length - 1];
        return this.focusTableCell(nextRow, nextAttribute);
      }
    }
  }

  private moveCursorRight(row: TableRow, attribute: Attribute) {
    const index = row.part.shownAttributes.indexOf(attribute);

    if (index < row.part.shownAttributes.length - 1) {
      const nextAttribute = row.part.shownAttributes[index + 1];
      return this.focusTableCell(row, nextAttribute);
    }

    if (row.nextLinkedRows.length > 0) {
      const nextRow = row.nextLinkedRows[0];
      if (nextRow.part.shownAttributes.length > 0) {
        const nextAttribute = nextRow.part.shownAttributes[0];
        return this.focusTableCell(nextRow, nextAttribute);
      }
    }
  }

  private moveCursorUp(row: TableRow, attribute: Attribute) {
    if (row.rowAbove) {
      this.focusTableCell(row.rowAbove, attribute);
    }
  }

  private moveCursorDown(row: TableRow, attribute: Attribute) {
    if (row.rowBelow) {
      this.focusTableCell(row.rowBelow, attribute);
    }
  }

  private focusTableCell(row: TableRow, attribute: Attribute) {
    this.selectedCell = {row: row, attribute: attribute};
  }

  public onLinkCollapse(row: TableRow) {
    this.tableManagerService.collapseRow(row);
  }

  public onLinkExpand(row: TableRow) {
    this.tableManagerService.expandRow(row);
  }

  public onDataChange(event: DataChangeEvent) {
    this.dataChange.emit(event);
  }

  public onDeleteDocument(doc: Document) {
    this.deleteDocument.emit(doc);
  }

  public onCreateLinkInstance(event: LinkInstanceEvent) {
    this.createLinkInstance.emit(event);
  }

  public onDeleteLinkInstance(linkInstanceId: string) {
    this.deleteLinkInstance.emit(linkInstanceId);
  }

  public getPrimaryRows(): TableRow[] {
    return this.parts.length > 0 ? this.parts[0].rows : [];
  }

}
