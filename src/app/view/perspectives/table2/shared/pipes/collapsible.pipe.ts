import {Pipe, PipeTransform} from '@angular/core';
import {TableRow} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'collapsible'
})
export class CollapsiblePipe implements PipeTransform {

  public transform(row: TableRow): boolean {
    return row.linkedRows && row.linkedRows.length > 1;
  }

}
