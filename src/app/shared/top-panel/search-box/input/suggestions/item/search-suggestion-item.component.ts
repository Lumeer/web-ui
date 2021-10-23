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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {QueryItem} from '../../../query-item/model/query-item';
import {QueryItemType} from '../../../query-item/model/query-item-type';

@Component({
  selector: 'search-suggestion-item',
  templateUrl: './search-suggestion-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionItemComponent implements OnChanges {
  @Input()
  public suggestion: QueryItem;

  @Input()
  public text: string;

  public isCollectionItem: boolean;
  public isFulltextItem: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.suggestion) {
      this.isCollectionItem = this.suggestion?.type === QueryItemType.Collection;
      this.isFulltextItem = this.suggestion?.type === QueryItemType.Fulltext;
    }
  }
}
