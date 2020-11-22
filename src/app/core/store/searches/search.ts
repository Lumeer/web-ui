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

import {SizeType} from '../../../shared/slider/size/size-type';
import {SearchTab} from '../navigation/search-tab';

export const DEFAULT_SEARCH_ID = 'default';

export interface Search {
  id: string;
  config?: SearchConfig;
}

export interface SearchConfig {
  documents?: SearchDocumentsConfig;
  views?: SearchViewsConfig;
  searchTab?: SearchTab;
}

export interface SearchDocumentsConfig {
  expandedIds?: string[];
  size: SizeType;
}

export interface SearchViewsConfig {
  size: SizeType;
}

export const defaultSizeType = SizeType.L;

export function createDefaultSearchConfig(searchTab?: SearchTab): SearchConfig {
  return {
    searchTab: searchTab || SearchTab.All,
    documents: {size: defaultSizeType},
    views: {size: defaultSizeType},
  };
}
