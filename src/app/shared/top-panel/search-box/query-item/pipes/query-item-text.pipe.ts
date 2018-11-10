/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DeletedQueryItem} from '../model/deleted.query-item';

@Pipe({
  name: 'queryItemText',
})
export class QueryItemTextPipe implements PipeTransform {
  constructor(private i18n: I18n) {}

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
      value: 'Deleted file',
    });
  }

  private deletedLinkText(): string {
    return this.i18n({
      id: 'query.item.deleted.link',
      value: 'Deleted link',
    });
  }

  private deletedDocumentText(): string {
    return this.i18n({
      id: 'query.item.deleted.document',
      value: 'Deleted record',
    });
  }

  private deletedAttributeText(): string {
    return this.i18n({
      id: 'query.item.deleted.attribute',
      value: 'Deleted attribute',
    });
  }

  private deletedText(): string {
    return this.i18n({
      id: 'query.item.deleted.default',
      value: 'Deleted',
    });
  }
}
