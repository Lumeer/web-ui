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

import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';

export class ConditionQueryItem implements QueryItem {

  public static conditions = ['=', '!=', '<', '>', '~'];
  public text: string;
  public value: string;
  public type: QueryItemType = QueryItemType.Condition;

  public constructor(condition: string) {
    this.text = condition;
    this.value = condition;
  }

  public isComplete(): boolean {
    return true;
  }

  public static isComplete(text: string): boolean {
    const trimmed = text.trim();
    const prefixLength = this.conditionPrefixLength(trimmed);
    return prefixLength > 0 && trimmed.length > prefixLength;
  }

  private static conditionPrefixLength(text: string): number {
    for (let condition of this.conditions) {
      if (text.startsWith(condition)) {
        return condition.length;
      }
    }
    return -1;
  }

}
