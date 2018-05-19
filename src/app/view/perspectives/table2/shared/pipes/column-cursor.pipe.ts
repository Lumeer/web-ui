import { Pipe, PipeTransform } from '@angular/core';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'columnCursor'
})
export class ColumnCursorPipe implements PipeTransform {

  public transform(cursor: TableBodyCursor, columnIndex: number): TableBodyCursor {
    return {...cursor, columnIndex};
  }

}
