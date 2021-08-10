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
import {User} from '../../../../core/store/users/user';
import {DropdownOption} from '../../../dropdown/options/dropdown-option';
import {sortObjectsByScore} from '../../../utils/common.utils';
import {removeAccentFromString, userDataValueCreateTeamValue} from '@lumeer/data-filters';
import {Team} from '../../../../core/store/teams/team';
import {COLOR_INFO} from '../../../../core/constants';

@Pipe({
  name: 'filterUsers',
})
export class FilterUsersPipe implements PipeTransform {
  public transform(users: User[], text: string, teams?: Team[]): DropdownOption[] {
    const textWithoutAccent = removeAccentFromString(text);
    const teamsGroup = $localize`:@@user.constraint.type.teams:Teams`;

    const filteredTeams: DropdownOption[] = (teams || [])
      .filter(team => removeAccentFromString(team.name).includes(textWithoutAccent))
      .map(team => ({
        value: userDataValueCreateTeamValue(team.id),
        displayValue: team.name,
        group: teamsGroup,
        border: COLOR_INFO,
        color: COLOR_INFO,
      }));

    const usersGroup = $localize`:@@user.constraint.type.users:Users`;

    const filteredUsersOptions: DropdownOption[] = (users || [])
      .filter(user => removeAccentFromString(user.name || user.email).includes(textWithoutAccent))
      .map(user => ({
        gravatar: user.email,
        value: user.email || user.name,
        displayValue: user.name || user.email,
        group: filteredTeams.length > 0 ? usersGroup : undefined,
      }));

    return [
      ...sortObjectsByScore<DropdownOption>(filteredTeams, text, ['displayValue', 'value']),
      ...sortObjectsByScore<DropdownOption>(filteredUsersOptions, text, ['displayValue', 'value']),
    ];
  }
}
