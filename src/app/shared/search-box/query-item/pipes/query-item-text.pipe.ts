import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DeletedQueryItem} from '../model/deleted.query-item';

@Pipe({
  name: 'queryItemText'
})
export class QueryItemTextPipe implements PipeTransform {

  constructor(private i18n: I18n) {
  }

  public transform(queryItem: QueryItem): string {
    if (queryItem.type === QueryItemType.Deleted) {
      switch ((queryItem as DeletedQueryItem).forType) {
        case QueryItemType.Collection:
          return this.deletedCollectionText();
        case QueryItemType.Link:
          return this.deletedLinkText();
        case QueryItemType.Attribute:
          return this.deletedAttributeText();
        case QueryItemType.Document:
          return this.deletedDocumentText();
        default:
          return this.deletedText();
      }
    }

    return queryItem.text;
  }

  private deletedCollectionText(): string {
    return this.i18n({
      id: 'query.item.deleted.file',
      value: 'Deleted file'
    });
  }

  private deletedLinkText(): string {
    return this.i18n({
      id: 'query.item.deleted.link',
      value: 'Deleted link'
    });
  }

  private deletedDocumentText(): string {
    return this.i18n({
      id: 'query.item.deleted.document',
      value: 'Deleted document'
    });
  }

  private deletedAttributeText(): string {
    return this.i18n({
      id: 'query.item.deleted.attribute',
      value: 'Deleted attribute'
    });
  }

  private deletedText(): string {
    return this.i18n({
      id: 'query.item.deleted.default',
      value: 'Deleted'
    });
  }

}
