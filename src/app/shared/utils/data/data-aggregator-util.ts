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

import {getOtherLinkedDocumentId, LinkInstance} from '../../../core/store/link-instances/link.instance';
import {findLastIndex} from '../common.utils';
import {uniqueValues} from '../array.utils';
import {DataResourceChain} from './data-aggregator';

export function createPossibleLinkingDocuments(otherChains: DataResourceChain[][]): string[] {
  return uniqueValues(
    otherChains
      .map(otherChain => {
        const linkChainIndex = findLastIndex(otherChain, chain => !!chain.linkInstanceId);
        const documentChain = otherChain[linkChainIndex - 1];
        return documentChain && documentChain.documentId;
      })
      .filter(documentId => !!documentId)
  );
}

export function createPossibleLinkingDocumentsByChains(
  dataResourceChain: DataResourceChain[],
  otherChains: DataResourceChain[][],
  linkInstances: LinkInstance[]
): {linkInstanceId?: string; documentId?: string; otherDocumentIds?: string[]} {
  const linkChainIndex = findLastIndex(dataResourceChain, chain => !!chain.linkInstanceId);
  const linkChain = dataResourceChain[linkChainIndex];
  const linkInstance = linkChain && (linkInstances || []).find(li => li.id === linkChain.linkInstanceId);
  const documentChain = dataResourceChain[linkChainIndex - 1];
  const documentId = getOtherLinkedDocumentId(linkInstance, documentChain && documentChain.documentId);
  if (!linkInstance || !documentId) {
    return {};
  }

  const otherDocumentIds = otherChains
    .map(otherChain => {
      const documentToLinkChain = otherChain[linkChainIndex - 1];
      if (documentToLinkChain && documentToLinkChain.documentId && documentToLinkChain.documentId !== documentId) {
        return documentToLinkChain.documentId;
      }
      return null;
    })
    .filter(doc => !!doc);
  return {linkInstanceId: linkChain.linkInstanceId, documentId, otherDocumentIds: uniqueValues(otherDocumentIds)};
}
