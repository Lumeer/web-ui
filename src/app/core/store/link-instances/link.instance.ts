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

import {DataValue} from '../../model/data/data-value';

export interface LinkInstance {
  id?: string;
  linkTypeId: string;
  documentIds: [string, string];
  version?: number;

  data?: {[attributeId: string]: DataValue | any}; // TODO remove any
}

export function getOtherLinkedDocumentId(linkInstance: LinkInstance, documentId: string): string {
  return linkInstance.documentIds[0] === documentId ? linkInstance.documentIds[1] : linkInstance.documentIds[0];
}
