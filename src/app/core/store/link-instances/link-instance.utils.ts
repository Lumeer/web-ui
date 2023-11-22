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
import {DocumentModel} from '../documents/document.model';
import {LinkInstance} from './link.instance';

export function isLinkInstanceValid(linkInstance: LinkInstance, documentsMap: Record<string, DocumentModel>): boolean {
  return (
    linkInstance.documentIds?.length === 2 && linkInstance.documentIds.every(documentId => !!documentsMap[documentId])
  );
}

export function isDocumentInLinkInstance(linkInstance: LinkInstance, documentId: string): boolean {
  return linkInstance.documentIds?.some(id => id === documentId);
}

export function isAnyDocumentInLinkInstance(linkInstance: LinkInstance, documentIds: string[]): boolean {
  return documentIds.includes(linkInstance.documentIds?.[0]) || documentIds.includes(linkInstance.documentIds?.[1]);
}

export function findLinkInstanceByDocumentId(linkInstances: LinkInstance[], documentId: string): LinkInstance {
  return linkInstances.find(linkInstance => isDocumentInLinkInstance(linkInstance, documentId));
}

export function getOtherDocumentIdFromLinkInstance(linkInstance: LinkInstance, ...otherDocumentIds: string[]): string {
  const {documentIds} = linkInstance;
  return otherDocumentIds.includes(documentIds[0]) ? documentIds[1] : documentIds[0];
}

export function mergeLinkInstances(linkInstancesA: LinkInstance[], linkInstancesB: LinkInstance[]): LinkInstance[] {
  if (linkInstancesA.length === 0 || linkInstancesB.length === 0) {
    return linkInstancesA.length > 0 ? linkInstancesA : linkInstancesB;
  }
  const documentsAIds = new Set(linkInstancesA.map(collection => collection.id));
  const documentsBToAdd = linkInstancesB.filter(collection => !documentsAIds.has(collection.id));
  return linkInstancesA.concat(documentsBToAdd);
}

export function sortLinkInstances(linkInstances: LinkInstance[]): LinkInstance[] {
  return [...(linkInstances || [])].sort((a, b) => a.id.localeCompare(b.id));
}

export function groupLinkInstancesByLinkTypes(linkInstances: LinkInstance[]): Record<string, LinkInstance[]> {
  return (linkInstances || []).reduce((map, document) => {
    if (!map[document.linkTypeId]) {
      map[document.linkTypeId] = [];
    }
    map[document.linkTypeId].push(document);
    return map;
  }, {});
}
