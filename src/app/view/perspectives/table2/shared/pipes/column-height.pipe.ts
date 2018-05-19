import {Pipe, PipeTransform} from '@angular/core';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableCompoundColumn, TableModel} from '../../../../../core/store/tables/table.model';
import {calculateColumnRowspan} from '../../../../../core/store/tables/table.utils';

export const TABLE_ROW_HEIGHT = 35;

@Pipe({
  name: 'columnHeight'
})
export class ColumnHeightPipe implements PipeTransform {

  public transform(column: TableCompoundColumn, table: TableModel, cursor: TableHeaderCursor): number {
    if (column.children.length) {
      return TABLE_ROW_HEIGHT;
    }

    const rowspan = calculateColumnRowspan(table, cursor.partIndex, cursor.columnPath.slice(0, cursor.columnPath.length - 1));
    return rowspan * TABLE_ROW_HEIGHT;
  }

}
