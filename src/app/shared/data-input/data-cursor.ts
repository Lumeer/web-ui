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

import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';

export interface DataCursor {
  collectionId?: string;
  documentId?: string;

  linkTypeId?: string;
  linkInstanceId?: string;

  attributeId?: string;
}

export function createDocumentDataCursor(document: DocumentModel, attributeId: string): DataCursor {
  return {
    collectionId: document.collectionId,
    documentId: document.id,
    attributeId,
  };
}

export function createLinkDataCursor(linkInstance: LinkInstance, attributeId: string): DataCursor {
  return {
    linkTypeId: linkInstance.linkTypeId,
    linkInstanceId: linkInstance.id,
    attributeId,
  };
}

export function isDataCursorEntityInitialized(cursor: DataCursor): boolean {
  return cursor && Boolean(cursor.documentId || cursor.linkInstanceId);
}
