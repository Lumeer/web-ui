import {Pipe, PipeTransform} from '@angular/core';
import {TableColumn, TableColumnType} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'isHiddenColumn'
})
export class IsHiddenColumnPipe implements PipeTransform {

  public transform(column: TableColumn): boolean {
    return column.type === TableColumnType.HIDDEN;
  }

}
