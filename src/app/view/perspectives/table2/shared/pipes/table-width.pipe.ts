import {Pipe, PipeTransform} from '@angular/core';
import {TableModel} from '../../../../../core/store/tables/table.model';
import {calculateColumnsWidth, filterLeafColumns} from '../../../../../core/store/tables/table.utils';

@Pipe({
  name: 'tableWidth'
})
export class TableWidthPipe implements PipeTransform {

  public transform(table: TableModel): number {
    return table.rowNumberWidth + table.parts.reduce((sum, part) => calculateColumnsWidth(filterLeafColumns(part.columns)), 0) + 1;
  }

}
