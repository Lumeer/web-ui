import {Pipe, PipeTransform} from '@angular/core';
import {DEFAULT_ROW_NUMBER_WIDTH, TableModel} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'rowNumberWidth'
})
export class RowNumberWidthPipe implements PipeTransform {

  public transform(table: TableModel): string {
    const rowNumberWidth = table.rowNumberWidth || DEFAULT_ROW_NUMBER_WIDTH;
    return `${rowNumberWidth}px`;
  }

}
