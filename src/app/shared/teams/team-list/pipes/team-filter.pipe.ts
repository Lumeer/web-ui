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

import {Pipe, PipeTransform, Injectable} from '@angular/core';

import {removeAccentFromString} from '@lumeer/data-filters';
import {Team} from '../../../../core/store/teams/team';

@Pipe({
  name: 'teamFilter',
})
@Injectable()
export class TeamFilterPipe implements PipeTransform {
  public transform(groups: Team[], value: string): Team[] {
    if (!groups || !value) {
      return groups;
    }

    const valueLowerCase = removeAccentFromString(value, true);
    return groups.filter(user => removeAccentFromString(user.name, true).includes(valueLowerCase));
  }
}
