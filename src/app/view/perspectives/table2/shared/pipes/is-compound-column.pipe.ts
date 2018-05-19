import {Pipe, PipeTransform} from '@angular/core';
import {TableColumn, TableColumnType} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'isCompoundColumn'
})
export class IsCompoundColumnPipe implements PipeTransform {

  public transform(column: TableColumn): boolean {
    return column.type === TableColumnType.COMPOUND;
  }

}
