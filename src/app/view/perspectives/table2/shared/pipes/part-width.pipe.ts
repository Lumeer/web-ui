import {Pipe, PipeTransform} from '@angular/core';
import {TablePart} from '../../../../../core/store/tables/table.model';
import {calculateColumnsWidth, filterLeafColumns} from '../../../../../core/store/tables/table.utils';

@Pipe({
  name: 'partWidth'
})
export class PartWidthPipe implements PipeTransform {

  public transform(part: TablePart): number {
    return calculateColumnsWidth(filterLeafColumns(part.columns));
  }

}
