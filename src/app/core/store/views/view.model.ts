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
import {ResourceModel} from '../../model/resource.model';
import {TableConfig} from '../tables/table.model';
import {SizeType} from '../../../shared/slider/size-type';
import {ChartConfig} from '../charts/chart.model';
import {Query} from '../navigation/query';

export interface ViewModel extends ResourceModel {
  perspective: Perspective;
  query: Query;
  config: ViewConfigModel;
  authorRights?: {[collectionId: string]: string[]};
}

export interface ViewCursor {
  linkInstanceId?: string;
  collectionId: string;
  documentId: string;
  attributeId?: string;
}

export interface ViewConfigModel {
  detail?: DetailConfigModel;
  postit?: PostItConfigModel;
  search?: SearchConfigModel;
  table?: TableConfig;
  chart?: ChartConfig;
}

export interface DetailConfigModel {
  whateverConfig?: string;
}

export interface PostItConfigModel {
  size?: SizeType;
  documentIdsOrder?: string[];
}

export interface SearchConfigModel {
  expandedDocumentIds?: string[];
  searchTab?: string; // TODO maybe create enum
}
