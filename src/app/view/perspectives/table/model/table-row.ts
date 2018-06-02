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

import {Document} from '../../../../core/dto/document';
import {TablePart} from './table-part';

export class TableRow {

  public part: TablePart;

  public documents: Document[] = [];

  public nextLinkedRows: TableRow[] = [];
  public previousLinkedRow: TableRow;

  public rowOffset: number;

  public rowNumber(): number {
    return this.rowAbove ? this.rowAbove.rowNumber() + this.rowAbove.countRows() : 1;
  }

  public get rowAbove(): TableRow {
    return this.part.rows[this.index() - 1];
  }

  public get rowBelow(): TableRow {
    return this.part.rows[this.index() + 1];
  }

  private index(): number {
    return this.part.rows.indexOf(this);
  }

  public isCollapsed(): boolean {
    return this.documents.length > 1;
  }

  public countRows(): number {
    if (this.nextLinkedRows.length === 0) {
      return 1;
    }

    return this.nextLinkedRows
      .map(linkedRow => linkedRow.countRows())
      .reduce((rows1, rows2) => rows1 + rows2);
  }

}
