import {Pipe, PipeTransform} from '@angular/core';
import {SelectConstraintOption} from '../../../core/model/data/constraint-config';

@Pipe({
  name: 'selectOptionsValues'
})
export class SelectOptionsValuesPipe implements PipeTransform {

  public transform(options: SelectConstraintOption[]): any[] {
    return (options || []).map(option => option.value);
  }

}
