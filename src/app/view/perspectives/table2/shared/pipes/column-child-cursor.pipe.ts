import {Pipe, PipeTransform} from '@angular/core';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'columnChildCursor'
})
export class ColumnChildCursorPipe implements PipeTransform {

  public transform(cursor: TableHeaderCursor, columnIndex: number): TableHeaderCursor {
    return {...cursor, columnPath: cursor.columnPath.concat(columnIndex)};
  }

}
