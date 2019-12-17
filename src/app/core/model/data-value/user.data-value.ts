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

import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {isEmailValid} from '../../../shared/utils/email.utils';
import {User} from '../../store/users/user';
import {ConstraintData} from '../data/constraint';
import {UserConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {isArray, isNotNullOrUndefined} from '../../../shared/utils/common.utils';

export class UserDataValue implements DataValue {
  public readonly users: User[];

  constructor(
    public readonly value: any,
    public readonly config: UserConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string,
  ) {
    this.users = this.createUsers();
  }

  private createUsers(): User[] {
    const users = this.constraintData && this.constraintData.users || [];
    const userValues: any[] = (isArray(this.value) ? this.value : [this.value]).filter(val => isNotNullOrUndefined(val) && val !== '');
    return userValues.map(userValue => {
      const user = users.find(u => u.email === userValue);
      if (user) {
        return user;
      }
      if (this.config.externalUsers && isEmailValid(String(userValue))) {
        return {email: String(userValue), name: String(userValue), groupsMap: {}};
      }
      return null;
    }).filter(user => !!user);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (this.users.length) {
      return this.users.map(user => user.name || user.email).join(', ');
    }

    return formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    if (this.config.multi) {
      return this.users.map(user => user.email);
    }

    return this.users.length ? this.users[0] : null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return this.users.length > 0;
  }

  public increment(): UserDataValue {
    return undefined; // not supported
  }

  public decrement(): UserDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: UserDataValue): number {
    if (this.config.multi || otherValue.config.multi) {
      return 0;
    }

    if (this.users[0] && otherValue.users[0]) {
      this.users[0].email.localeCompare(otherValue.users[0].email);
    }

    return String(this.value).localeCompare(String(otherValue.value));
  }

  public copy(newValue?: any): UserDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new UserDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): UserDataValue {
    return new UserDataValue(inputValue, this.config, this.constraintData, inputValue);
  }
}
