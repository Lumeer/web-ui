import { Pipe, PipeTransform } from '@angular/core';
import {TableColumn} from '../../../../../core/store/tables/table.model';
import {getTableColumnWidth} from '../../../../../core/store/tables/table.utils';

@Pipe({
  name: 'columnWidth'
})
export class ColumnWidthPipe implements PipeTransform {

  public transform(column: TableColumn): number {
    return getTableColumnWidth(column);
  }

}
