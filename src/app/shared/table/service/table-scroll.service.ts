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

import {
  SelectedTableCell,
  TABLE_BOTTOM_TOOLBAR_HEIGHT,
  TABLE_ROW_HEIGHT,
  TableCellType,
  TableModel,
} from '../model/table-model';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {groupTableColumns} from '../model/table-utils';

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

    const groupedColumns = groupTableColumns(tableModel.columns);

    const groupIndex = groupedColumns.findIndex(group => group.column?.id === selectedCell.columnId);
    const selectedGroup = groupedColumns[groupIndex];
    const columnLeft = groupedColumns.slice(0, groupIndex).reduce((sum, group) => sum + group.width, 0);

    let scrollLeft = undefined;
    if (columnLeft < left) {
      scrollLeft = columnLeft;
    } else if (selectedGroup && right < columnLeft + selectedGroup.width) {
      scrollLeft = columnLeft + (width > selectedGroup.width ? selectedGroup.width - width : 0);
    }

    const height = viewPort.getViewportSize() - TABLE_ROW_HEIGHT - TABLE_BOTTOM_TOOLBAR_HEIGHT;
    const top = viewPort.measureScrollOffset('top');
    const bottom = top + height;

    let scrollTop = undefined;
    if (selectedCell?.type === TableCellType.Body) {
      const rowIndex = tableModel.rows.findIndex(
        row => row.id === selectedCell.rowId && row.linkInstanceId === selectedCell.linkId
      );
      const selectedRow = tableModel.rows[rowIndex];
      const rowTop = tableModel.rows.slice(0, rowIndex).reduce((sum, row) => sum + row.height, 0);

      if (rowTop < top) {
        scrollTop = rowTop;
      } else if (selectedRow && bottom <= rowTop + selectedRow.height) {
        scrollTop = rowTop - (height > selectedRow.height ? height - selectedRow.height : 0);
      }
    }

    return {top: scrollTop, left: scrollLeft};
  }
}
