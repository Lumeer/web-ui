import {Pipe, PipeTransform} from '@angular/core';
import {TableCursor} from '../../../../../core/store/tables/table-cursor';

@Pipe({
  name: 'isFirstPart'
})
export class IsFirstPartPipe implements PipeTransform {

  public transform(cursor: TableCursor): boolean {
    return cursor && cursor.partIndex === 0;
  }

}
