import { Pipe, PipeTransform } from '@angular/core';
import {TableModel} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'maxParts'
})
export class MaxPartsPipe implements PipeTransform {

  public transform(table: TableModel, maxNumber: number): boolean {
    return table.parts.length <= maxNumber;
  }

}
