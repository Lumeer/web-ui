import {Pipe, PipeTransform} from '@angular/core';
import {DEFAULT_TABLE_ID, TableModel} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'embedded'
})
export class EmbeddedPipe implements PipeTransform {

  public transform(table: TableModel): boolean {
    return table && table.id !== DEFAULT_TABLE_ID;
  }

}
