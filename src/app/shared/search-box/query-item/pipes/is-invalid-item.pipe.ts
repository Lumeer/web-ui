import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';

@Pipe({
  name: 'isInvalidItem'
})
export class IsInvalidItemPipe implements PipeTransform {

public transform(queryItem: QueryItem): boolean {
    return queryItem.type === QueryItemType.Invalid;
  }

}
