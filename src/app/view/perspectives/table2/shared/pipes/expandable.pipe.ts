import {Pipe, PipeTransform} from '@angular/core';
import {TableRow} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'expandable'
})
export class ExpandablePipe implements PipeTransform {

  public transform(row: TableRow): boolean {
    if (!row.linkedRows || row.linkedRows.length !== 1) {
      return false;
    }
    const linkedRow = row.linkedRows[0];
    return (linkedRow.documentIds && linkedRow.documentIds.length > 1) ||
      (linkedRow.linkInstanceIds && linkedRow.linkInstanceIds.length > 1);
  }

}
