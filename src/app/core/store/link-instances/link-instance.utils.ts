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

import {LinkInstance} from '../../dto';
import {LinkInstanceModel} from './link-instance.model';

export function isDocumentInLinkInstance(linkInstance: LinkInstanceModel, documentId: string): boolean {
  return linkInstance.documentIds.some(id => id === documentId);
}

export function findLinkInstanceByDocumentId(linkInstances: LinkInstanceModel[], documentId: string): LinkInstance {
  return linkInstances.find(linkInstance => isDocumentInLinkInstance(linkInstance, documentId));
}

export function getOtherDocumentIdFromLinkInstance(linkInstance: LinkInstanceModel, documentId: string): string {
  const {documentIds} = linkInstance;
  return documentIds[0] === documentId ? documentIds[1] : documentIds[0];
}
