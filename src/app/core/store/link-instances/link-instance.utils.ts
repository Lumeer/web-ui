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

import {LinkInstanceDto} from '../../dto';
import {LinkInstance} from './link.instance';

export function isDocumentInLinkInstance(linkInstance: LinkInstance, documentId: string): boolean {
  return linkInstance.documentIds.some(id => id === documentId);
}

export function findLinkInstanceByDocumentId(linkInstances: LinkInstance[], documentId: string): LinkInstanceDto {
  return linkInstances.find(linkInstance => isDocumentInLinkInstance(linkInstance, documentId));
}

export function getOtherDocumentIdFromLinkInstance(linkInstance: LinkInstance, documentId: string): string {
  const {documentIds} = linkInstance;
  return documentIds[0] === documentId ? documentIds[1] : documentIds[0];
}
