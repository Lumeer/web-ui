import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {InvalidQueryItem} from '../model/invalid.query-item';

@Pipe({
  name: 'queryItemText'
})
export class QueryItemTextPipe implements PipeTransform {

  constructor(private i18n: I18n) {
  }

  public transform(queryItem: QueryItem): string {
    if (queryItem.type === QueryItemType.Invalid) {
      switch ((queryItem as InvalidQueryItem).forType) {
        case QueryItemType.Collection:
          return this.invalidCollectionText();
        case QueryItemType.Link:
          return this.invalidLinkText();
        case QueryItemType.Attribute:
          return this.invalidAttributeText();
        case QueryItemType.Document:
          return this.invalidDocumentText();
        default:
          return this.invalidText();
      }
    }

    return queryItem.text;
  }

  private invalidCollectionText(): string {
    return this.i18n({
      id: 'query.item.invalid.collection',
      value: 'Invalid collection'
    });
  }

  private invalidLinkText(): string {
    return this.i18n({
      id: 'query.item.invalid.link',
      value: 'Invalid link'
    });
  }

  private invalidDocumentText(): string {
    return this.i18n({
      id: 'query.item.invalid.document',
      value: 'Invalid document'
    });
  }

  private invalidAttributeText(): string {
    return this.i18n({
      id: 'query.item.invalid.attribute',
      value: 'Invalid attribute'
    });
  }

  private invalidText(): string {
    return this.i18n({
      id: 'query.item.invalid.default',
      value: 'Invalid'
    });
  }

}
