import {Pipe, PipeTransform} from '@angular/core';
import {TableColumn, TableColumnType} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'isSingleColumn'
})
export class IsSingleColumnPipe implements PipeTransform {

  public transform(column: TableColumn): boolean {
    return column.type === TableColumnType.SINGLE;
  }

}
