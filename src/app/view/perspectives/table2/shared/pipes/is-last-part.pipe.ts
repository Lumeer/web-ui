import { Pipe, PipeTransform } from '@angular/core';
import {TableCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'isLastPart'
})
export class IsLastPartPipe implements PipeTransform {

  public transform(cursor: TableCursor, table: TableModel): boolean {
    return cursor && table && cursor.partIndex + 2 > table.parts.length - 1;
  }

}
