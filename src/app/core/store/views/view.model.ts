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

import {Perspective} from '../../../view/perspectives/perspective';
import {QueryModel} from '../navigation/query.model';
import {PermissionsModel} from '../permissions/permissions.model';

export interface ViewModel {

  code?: string;
  name: string;

  perspective: Perspective;
  query: QueryModel;
  config: ViewConfigModel;

  permissions?: PermissionsModel;

}

export interface ViewConfigModel {

  search?: SearchConfigModel;
  table?: TableConfigModel;

}

export interface SearchConfigModel {

  expandedDocumentIds?: string[];
  searchTab?: string; // TODO maybe create enum

}

export interface TableConfigModel {

  parts: {
    collectionCode: string;
    attributeIds: string[];
    sortedBy?: string;
    sortedDesc?: boolean;
    linkTypeId?: string;
    linkAttributeIds?: string[];
    expandedDocumentIds?: string[];
  }[];

}
