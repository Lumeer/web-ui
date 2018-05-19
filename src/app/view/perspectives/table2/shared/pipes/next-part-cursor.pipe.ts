import { Pipe, PipeTransform } from '@angular/core';
import {TableCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'nextPartCursor'
})
export class NextPartCursorPipe implements PipeTransform {

  public transform(cursor: TableCursor, skip?: boolean): TableCursor {
    return {...cursor, partIndex: cursor.partIndex + (skip ? 0 : 1)};
  }

}
