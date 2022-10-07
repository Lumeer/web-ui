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

import {Perspective} from '../../../view/perspectives/perspective';
import {ModalData} from '../../model/modal-data';

export interface ViewSettings {
  attributes?: AttributesSettings;
  data?: DataSettings;
  modals?: ModalsSettings;
}

export interface DataSettings {
  includeSubItems?: boolean;
}

export interface ModalsSettings {
  settings: ModalSettings[];
}

export interface ModalSettings {
  key: string;
  perspective?: Perspective;
  data: ModalData;
}

export interface AttributesSettings {
  collections?: Record<string, ResourceAttributeSettings[]>;
  linkTypes?: Record<string, ResourceAttributeSettings[]>;
  linkTypesCollections?: Record<string, ResourceAttributeSettings[]>; // key is constructed as `${linkTypeId}:${collectionId}`
}

export interface ResourceAttributeSettings {
  attributeId: string;
  hidden?: boolean;
  sort?: AttributeSortType;
  width?: number;
}

export enum AttributeSortType {
  Ascending = 'asc',
  Descending = 'desc',
}
