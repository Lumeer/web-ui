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

export interface LinkInstance {
  id?: string;
  linkTypeId: string;
  documentIds: [string, string];
  correlationId?: string;

  creationDate?: Date;
  updateDate?: Date;
  createdBy?: string;
  updatedBy?: string;
  dataVersion?: number;

  data?: Record<string, any>;
}

export function getOtherLinkedDocumentId(linkInstance: LinkInstance, documentId: string): string {
  return linkInstance.documentIds[0] === documentId ? linkInstance.documentIds[1] : linkInstance.documentIds[0];
}

export function getOtherLinkedDocumentIds(linkInstances: LinkInstance[], documentId: string): string[] {
  return linkInstances.reduce((acc, linkInstance) => {
    const otherDocumentId = getOtherLinkedDocumentId(linkInstance, documentId);
    acc.push(otherDocumentId);
    return acc;
  }, []);
}
