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
import {ConstraintType, UserConstraintType, UserDataValue} from '@lumeer/data-filters';

import {Team} from '../../../core/store/teams/team';
import {User} from '../../../core/store/users/user';

export function createUserDataInputUsers(value: UserDataValue): User[] {
  const type = value?.config?.type;

  let users: User[] = [];
  if (type !== UserConstraintType.Teams) {
    users = [...(value?.constraintData?.users || [])];
  }

  const usersEmails = new Set(users.map(user => user.email));
  (value?.users || []).forEach(user => {
    if (!usersEmails.has(user.email)) {
      users.push(user);
      usersEmails.add(user.email);
    }
  });

  const invalidEmails = value?.constraintData?.invalidValuesMap?.[ConstraintType.User];
  invalidEmails?.forEach(email => {
    if (!usersEmails.has(email)) {
      users.push({email});
      usersEmails.add(email);
    }
  });
  return users;
}

export function createUserDataInputTeams(value: UserDataValue): Team[] {
  const type = value?.config?.type;
  if ([UserConstraintType.Teams, UserConstraintType.UsersAndTeams].includes(type)) {
    return value?.constraintData?.teams || [];
  }
  return value?.teams || [];
}
