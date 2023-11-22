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

import {getViewColor} from '@lumeer/data-filters';
import {removeAccentFromString} from '@lumeer/utils';

import {Collection} from '../../../../core/store/collections/collection';
import {View} from '../../../../core/store/views/view';
import {getViewIcon} from '../../../../core/store/views/view.utils';
import {DropdownOption} from '../../../dropdown/options/dropdown-option';
import {sortObjectsByScore} from '../../../utils/common.utils';

@Pipe({
  name: 'filterViews',
})
export class FilterViewsPipe implements PipeTransform {
  public transform(views: View[], text: string, collectionsMap: Record<string, Collection>): DropdownOption[] {
    const filteredUsersOptions = (views || [])
      .filter(view => removeAccentFromString(view.name).includes(removeAccentFromString(text)))
      .map(view => ({
        value: view.id,
        displayValue: view.name,
        icons: [getViewIcon(view)],
        iconColors: [getViewColor(view, collectionsMap)],
      }));

    return sortObjectsByScore<DropdownOption>(filteredUsersOptions, text, ['displayValue', 'value']);
  }
}
