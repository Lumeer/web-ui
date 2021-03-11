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
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';

@Pipe({
  name: 'countSelectedLinkedDocuments',
})
export class CountSelectedLinkedDocumentsPipe implements PipeTransform {
  public transform(
    documents: DocumentModel[],
    linkInstances: LinkInstance[],
    selectedDocumentsIds: string[],
    removedLinkInstanceIds: string[]
  ): number {
    const selectedLinkInstances = linkInstances.filter(
      linkInstance => !removedLinkInstanceIds.includes(linkInstance.id)
    );
    const selectedDocuments = documents.filter(document => selectedDocumentsIds.includes(document.id));
    return selectedLinkInstances.length + selectedDocuments.length;
  }
}
