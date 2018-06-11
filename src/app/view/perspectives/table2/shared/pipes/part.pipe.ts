import {Pipe, PipeTransform} from '@angular/core';
import {TableCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel, TablePart} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'part'
})
export class PartPipe implements PipeTransform {

  public transform(table: TableModel, cursor: TableCursor): TablePart {
    return table.parts[cursor.partIndex];
  }

}
