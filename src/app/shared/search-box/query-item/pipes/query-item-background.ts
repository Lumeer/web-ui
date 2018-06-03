import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {HtmlModifier} from '../../../utils/html-modifier';

const DEFAULT_BACKGROUND_COLOR = '#faeabb';
const LINK_BACKGROUND_COLOR = '#ffffff';

@Pipe({
  name: 'queryItemBackground'
})
export class QueryItemBackgroundPipe implements PipeTransform {

  public transform(queryItem: QueryItem, isValid: boolean): string {
    if (queryItem.type === QueryItemType.Link || queryItem.type === QueryItemType.View) {
      return LINK_BACKGROUND_COLOR;
    }

    if (queryItem.colors && queryItem.colors.length === 1) {
      return HtmlModifier.shadeColor(queryItem.colors[0], .5);

    }

    return DEFAULT_BACKGROUND_COLOR;
  }

}
