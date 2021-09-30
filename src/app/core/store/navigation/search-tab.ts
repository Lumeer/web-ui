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

import {Perspective, perspectivesMap} from '../../../view/perspectives/perspective';

export enum SearchTab {
  All = 'all',
  Collections = 'tables',
  Tasks = 'tasks',
  Views = 'views',
}

export const searchTabsMap: Record<string, SearchTab> = {
  [SearchTab.All]: SearchTab.All,
  [SearchTab.Collections]: SearchTab.Collections,
  [SearchTab.Tasks]: SearchTab.Tasks,
  [SearchTab.Views]: SearchTab.Views,
};

export function parseSearchTabFromUrl(url: string): string | null {
  let questionIndex = url.indexOf('?');
  if (questionIndex === -1) {
    questionIndex = url.length;
  }

  const paths = url.substring(0, questionIndex).split('/');
  let currentIndex = paths.indexOf('w');
  if (currentIndex !== -1 && paths.length > currentIndex + 3) {
    currentIndex += 3; // skip workspace paths

    if (paths[currentIndex].startsWith('view') && paths.length > currentIndex++) {
      const perspective = perspectivesMap[paths[currentIndex]];
      if (perspective === Perspective.Search && paths.length > currentIndex++) {
        return paths[currentIndex];
      }
    }
  }

  return null;
}
