import {Pipe, PipeTransform} from '@angular/core';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'dragClass'
})
export class DragClassPipe implements PipeTransform {

  public transform(cursor: TableHeaderCursor): any {
    const path = cursor.columnPath.slice(0, -1);
    return `drag-${cursor.tableId}-${cursor.partIndex}-${path.join('-')}`;
  }

}
