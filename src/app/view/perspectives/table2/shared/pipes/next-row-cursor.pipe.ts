import {Pipe, PipeTransform} from '@angular/core';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'nextRowCursor'
})
export class NextRowCursorPipe implements PipeTransform {

  public transform(cursor: TableBodyCursor, rowIndex: number): TableBodyCursor {
    return {...cursor, rowPath: cursor.rowPath.concat(rowIndex)};
  }

}
