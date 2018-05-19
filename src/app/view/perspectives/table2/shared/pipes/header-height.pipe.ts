import {Pipe, PipeTransform} from '@angular/core';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../core/store/tables/table.model';
import {calculateColumnRowspan} from '../../../../../core/store/tables/table.utils';
import {TABLE_ROW_HEIGHT} from './column-height.pipe';

@Pipe({
  name: 'headerHeight'
})
export class HeaderHeightPipe implements PipeTransform {

  public transform(table: TableModel, cursor: TableHeaderCursor): number {
    const rowspan = calculateColumnRowspan(table, cursor.partIndex, cursor.columnPath);
    return rowspan * TABLE_ROW_HEIGHT;
  }

}
