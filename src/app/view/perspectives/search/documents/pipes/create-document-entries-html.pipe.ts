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
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Collection} from '../../../../../core/store/collections/collection';
import {createSearchDocumentEntriesHtml} from '../search-document-html-helper';
import {SizeType} from '../../../../../shared/slider/size-type';
import {SearchDocumentsConfig} from '../../../../../core/store/searches/search';

@Pipe({
  name: 'createDocumentEntriesHtml',
})
export class CreateDocumentEntriesHtmlPipe implements PipeTransform {
  public transform(
    document: DocumentModel,
    collections: Collection[],
    constraintData: ConstraintData,
    config: SearchDocumentsConfig
  ): any {
    const collection = (collections || []).find(coll => coll.id === document.collectionId);
    const expanded = config && (config.size === SizeType.XL || (config.size || []).includes(document.id));
    return createSearchDocumentEntriesHtml(document, collection, constraintData, expanded);
  }
}
