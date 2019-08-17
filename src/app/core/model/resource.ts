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

import {Permissions} from '../store/permissions/permissions';
import {Collection} from '../store/collections/collection';
import {DocumentModel} from '../store/documents/document.model';
import {LinkInstance} from '../store/link-instances/link.instance';
import {LinkType} from '../store/link-types/link.type';

export interface Resource {
  id?: string;
  code?: string;
  name: string;
  color?: string;
  icon?: string;
  version?: number;
  description?: string;
  permissions?: Permissions;

  correlationId?: string;
  nonRemovable?: boolean;
  lastTimeUsed?: Date;
  favorite?: boolean;
}

export enum AttributesResourceType {
  Collection = 'collection',
  LinkType = 'linkType',
}

export type DataResource =
  | Pick<DocumentModel, 'id' | 'data' | 'collectionId'>
  | Pick<LinkInstance, 'id' | 'data' | 'linkTypeId'>;

export type AttributesResource =
  | Pick<Collection, 'id' | 'attributes' | 'name' | 'color' | 'icon'>
  | Pick<LinkType, 'id' | 'attributes' | 'name' | 'collections'>;
