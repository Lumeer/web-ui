import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {QueryItemBackgroundPipe} from './query-item-background';

const LINK_BORDER_COLOR = '#ced4da';

@Pipe({
  name: 'queryItemBorder'
})
export class QueryItemBorderPipe extends QueryItemBackgroundPipe implements PipeTransform {

  public transform(queryItem: QueryItem): string {
    if (queryItem.type === QueryItemType.Link || queryItem.type === QueryItemType.View) {
      return LINK_BORDER_COLOR;
    }
    return super.transform(queryItem);
  }

}
