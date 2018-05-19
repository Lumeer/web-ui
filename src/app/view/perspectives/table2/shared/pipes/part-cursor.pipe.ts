import {Pipe, PipeTransform} from '@angular/core';
import {TableCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'partCursor'
})
export class PartCursorPipe implements PipeTransform {

  public transform(cursor: TableCursor, partIndex: number): TableCursor {
    return {...cursor, partIndex};
  }

}
