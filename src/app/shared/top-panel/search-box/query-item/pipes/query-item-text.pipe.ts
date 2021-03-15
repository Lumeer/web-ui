/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
import {DeletedQueryItem} from '../model/deleted.query-item';

@Pipe({
  name: 'queryItemText',
})
export class QueryItemTextPipe implements PipeTransform {
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
    return $localize`:@@query.item.deleted.file:Deleted table`;
  }

  private deletedLinkText(): string {
    return $localize`:@@query.item.deleted.link:Deleted link`;
  }

  private deletedDocumentText(): string {
    return $localize`:@@query.item.deleted.document:Deleted record`;
  }

  private deletedAttributeText(): string {
    return $localize`:@@query.item.deleted.attribute:Deleted attribute`;
  }

  private deletedText(): string {
    return $localize`:@@query.item.deleted.default:Deleted`;
  }
}
