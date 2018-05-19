import {Pipe, PipeTransform} from '@angular/core';
import {QueryModel} from '../../../../../core/store/navigation/query.model';

@Pipe({
  name: 'displayable'
})
export class DisplayablePipe implements PipeTransform {

  public transform(query: QueryModel): boolean {
    return query && query.collectionIds && query.collectionIds.length === 1;
  }

}
