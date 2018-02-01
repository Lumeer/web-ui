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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HtmlModifier} from '../../utils/html-modifier';
import {QueryItem} from './model/query-item';
import {QueryItemType} from './model/query-item-type';

const DEFAULT_BACKGROUND_COLOR = '#faeabb';
const LINK_BACKGROUND_COLOR = '#ffffff';
const LINK_BORDER_COLOR = '#ced4da';

@Component({
  selector: 'query-item',
  templateUrl: './query-item.component.html',
  styleUrls: ['./query-item.component.scss']
})
export class QueryItemComponent {

  @Input()
  public queryItem: QueryItem;

  @Input()
  public readonly: boolean;

  @Output()
  public remove = new EventEmitter();

  public onRemove() {
    this.remove.emit();
  }

  public isAttributeItem(): boolean {
    return this.queryItem.type === QueryItemType.Attribute;
  }

  public isCollectionItem(): boolean {
    return this.queryItem.type === QueryItemType.Collection;
  }

  public backgroundColor(): string {
    if (this.queryItem.colors && this.queryItem.colors.length === 1) {
      return HtmlModifier.shadeColor(this.queryItem.colors[0], .5);
    }

    if (this.queryItem.type === QueryItemType.Link) {
      return LINK_BACKGROUND_COLOR;
    }

    return DEFAULT_BACKGROUND_COLOR;
  }

  public borderColor(): string {
    if (this.queryItem.type === QueryItemType.Link) {
      return LINK_BORDER_COLOR;
    }
    return this.backgroundColor();
  }

}
