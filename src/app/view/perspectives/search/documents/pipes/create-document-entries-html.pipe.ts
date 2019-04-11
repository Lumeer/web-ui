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
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Collection} from '../../../../../core/store/collections/collection';
import {createSearchDocumentEntriesHtml} from '../search-document-html-helper';
import {SizeType} from '../../../../../shared/slider/size-type';

@Pipe({
  name: 'createDocumentEntriesHtml',
})
export class CreateDocumentEntriesHtmlPipe implements PipeTransform {
  public transform(
    document: DocumentModel,
    collectionsMap: Record<string, Collection>,
    expandedDocumentIds: string[],
    size: SizeType
  ): any {
    const collection = collectionsMap[document.collectionId];
    const expanded = size === SizeType.XL || expandedDocumentIds.includes(document.id);
    return createSearchDocumentEntriesHtml(document, collection, expanded);
  }
}
