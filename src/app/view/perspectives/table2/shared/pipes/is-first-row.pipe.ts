import { Pipe, PipeTransform } from '@angular/core';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'isFirstRow'
})
export class IsFirstRowPipe implements PipeTransform {

  public transform(cursor: TableBodyCursor): boolean {
    return cursor && cursor.rowPath && cursor.rowPath[0] === 0;
  }

}
