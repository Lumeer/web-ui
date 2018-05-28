import {Pipe, PipeTransform} from '@angular/core';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Perspective} from '../../view/perspectives/perspective';

@Pipe({
  name: 'filterPerspectives'
})
export class FilterPerspectivesPipe implements PipeTransform {

  public transform(perspectives: Perspective[], query: QueryModel): Perspective[] {
    return perspectives.filter(perspective => canShowPerspective(perspective, query));
  }

}

function canShowPerspective(perspective: Perspective, query: QueryModel): boolean {
  switch (perspective) {
    case Perspective.Table2:
    case Perspective.SmartDoc:
    case Perspective.Chart:
      return isSingleCollectionInQuery(query);
    case Perspective.Table:
      return false;
    default:
      return true;
  }
}

function isSingleCollectionInQuery(query: QueryModel): boolean {
  return query && query.collectionIds && query.collectionIds.length === 1;
}
