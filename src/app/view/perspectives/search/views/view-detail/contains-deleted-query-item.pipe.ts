import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../../../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemType} from '../../../../../shared/top-panel/search-box/query-item/model/query-item-type';

@Pipe({
  name: 'containsDeletedQueryItem',
})
export class ContainsDeletedQueryItemPipe implements PipeTransform {
  transform(queryItems: QueryItem[]): boolean {
    return !!queryItems.find(queryItem => queryItem.type === QueryItemType.Deleted);
  }
}
