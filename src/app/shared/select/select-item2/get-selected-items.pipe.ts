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
import {AreIdsEqualPipe} from '../select-item/are-ids-equal.pipe';
import {SelectItem2Model} from './select-item2.model';

@Pipe({
  name: 'getSelectedItems',
})
export class GetSelectedItemsPipe implements PipeTransform {
  public constructor(private areIdsEqualPipe: AreIdsEqualPipe) {}

  public transform(idsPath: any[], items: SelectItem2Model[]): SelectItem2Model {
    const item = items.find(itm => this.areIdsEqualPipe.transform(idsPath?.[0], itm.id));
    if (item) {
      const path = [item];
      for (let i = 1; i < idsPath.length; i++) {
        const childItem = path[i - 1].children?.find(children =>
          this.areIdsEqualPipe.transform(idsPath[i], children.id)
        );
        if (!childItem) {
          break;
        }
        path.push(childItem);
      }

      const mainItem = {...path[0], children: []};
      let currentItem = mainItem;
      for (let i = 1; i < path.length; i++) {
        const newItem = {...path[i], children: []};
        currentItem.children.push(newItem);
        currentItem = newItem;
      }

      return mainItem;
    }

    return null;
  }
}
