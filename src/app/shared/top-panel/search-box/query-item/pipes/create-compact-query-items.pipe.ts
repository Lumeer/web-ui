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

import {Pipe, PipeTransform} from '@angular/core';
import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {QueryStemQueryItem} from '../model/query-stem.query-item';
import {CollectionQueryItem} from '../model/collection.query-item';
import {QueryStemInputQueryItem} from '../model/query-stem-input.query-item';
import {findLastIndex} from '../../../../utils/common.utils';
import {SearchBoxData} from '../../util/search-box.service';

@Pipe({
  name: 'createCompactQueryItems',
})
export class CreateCompactQueryItemsPipe implements PipeTransform {
  public transform(
    queryItems: QueryItem[],
    data: SearchBoxData
  ): {queryItem: QueryItem; realIndex: number; stemIndex: number}[] {
    const resultData = [];
    let stemIndex = -1;
    let currentStemId: string;
    for (let i = 0; i < queryItems.length; i++) {
      if (queryItems[i].type === QueryItemType.Collection) {
        {
          // handle previous query stem
          let startStemIndex = findLastIndex(queryItems.slice(0, i), item => item.type === QueryItemType.Collection);
          if (startStemIndex === -1) {
            startStemIndex = 0;
          }

          // add plus button for previous query stem
          if (currentStemId) {
            const text = data.stemTextsMap?.[currentStemId] || '';
            resultData.push({
              queryItem: new QueryStemInputQueryItem(currentStemId, text, queryItems.slice(startStemIndex, i)),
              stemIndex,
              realIndex: i,
            });
          }
        }

        stemIndex++;

        let endStemIndex = queryItems
          .slice(i + 1, queryItems.length)
          .findIndex(item => item.type === QueryItemType.Collection || item.type === QueryItemType.Fulltext);
        if (endStemIndex === -1) {
          endStemIndex = queryItems.length;
        } else {
          endStemIndex += i + 1;
        }

        currentStemId = (<CollectionQueryItem>queryItems[i]).stemId;
        if (!data?.collapsibleStemIds?.includes(currentStemId) || endStemIndex - i === 1) {
          // there is nothing to expand/collapse
          resultData.push({queryItem: queryItems[i], stemIndex, realIndex: i});
        } else if (data?.expandedStemIds?.includes(currentStemId)) {
          const stemQueryItem = new QueryStemQueryItem([queryItems[i]]);
          resultData.push({queryItem: stemQueryItem, stemIndex, realIndex: i});
        } else {
          const stemQueryItem = new QueryStemQueryItem(queryItems.slice(i, endStemIndex));
          resultData.push({queryItem: stemQueryItem, stemIndex, realIndex: i});
          i += endStemIndex - i - 1;
        }
      } else {
        resultData.push({queryItem: queryItems[i], stemIndex, realIndex: i});
      }
    }
    return resultData;
  }
}
