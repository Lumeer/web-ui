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

import {SelectedTableCell, TABLE_ROW_HEIGHT, TableCellType, TableModel} from '../model/table-model';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';

export class TableScrollService {
  constructor(private viewPort: () => CdkVirtualScrollViewport) {}

  public computeScrollOffsets(tableModel: TableModel, selectedCell: SelectedTableCell): {top?: number; left?: number} {
    const viewPort = this.viewPort();
    if (!tableModel || !selectedCell || !viewPort) {
      return {};
    }

    const width = viewPort.elementRef.nativeElement.clientWidth;
    const left = viewPort.measureScrollOffset('left');
    const right = left + width;

    const columnIndex = tableModel.columns.findIndex(column => column.id === selectedCell.columnId);
    const selectedColumn = tableModel.columns[columnIndex];
    const columnLeft = tableModel.columns.slice(0, columnIndex).reduce((sum, column) => sum + column.width, 0);

    let scrollLeft = undefined;
    if (columnLeft < left) {
      scrollLeft = columnLeft;
    } else if (right < columnLeft + selectedColumn.width) {
      scrollLeft = columnLeft + (width > selectedColumn.width ? selectedColumn.width - width : 0);
    }

    const height = viewPort.getViewportSize() - TABLE_ROW_HEIGHT;
    const top = viewPort.measureScrollOffset('top');
    const bottom = top + height;

    let scrollTop = undefined;
    if (selectedCell?.type === TableCellType.Body) {
      const rowIndex = tableModel.rows.findIndex(row => row.id === selectedCell.rowId);
      const selectedRow = tableModel.rows[rowIndex];
      const rowTop = tableModel.rows.slice(0, rowIndex).reduce((sum, row) => sum + row.height, 0);

      if (rowTop < top) {
        scrollTop = rowTop;
      } else if (bottom < rowTop + selectedRow.height) {
        scrollTop = rowTop + (height > selectedRow.height ? selectedRow.height - height : 0);
      }
    }

    return {top: scrollTop, left: scrollLeft};
  }
}
