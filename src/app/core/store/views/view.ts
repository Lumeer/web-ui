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
import {Resource} from '../../model/resource';
import {TableConfig} from '../tables/table.model';
import {SizeType} from '../../../shared/slider/size-type';
import {ChartConfig} from '../charts/chart';
import {Query} from '../navigation/query';

export interface View extends Resource {
  perspective: Perspective;
  query: Query;
  config: ViewConfig;
  authorRights?: {[collectionId: string]: string[]};
}

export interface ViewCursor {
  linkInstanceId?: string;
  collectionId: string;
  documentId: string;
  attributeId?: string;
}

export interface ViewConfig {
  detail?: DetailConfig;
  postit?: PostItConfig;
  search?: SearchConfig;
  table?: TableConfig;
  chart?: ChartConfig;
}

export interface DetailConfig {
  whateverConfig?: string;
}

export interface PostItConfig {
  size?: SizeType;
  documentIdsOrder?: string[];
}

export interface SearchConfig {
  expandedDocumentIds?: string[];
  searchTab?: string; // TODO maybe create enum
}
