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
import {User} from '../../store/users/user';
import {ConstraintData} from '../data/constraint';
import {UserConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {isArray, isNotNullOrUndefined} from '../../../shared/utils/common.utils';
import {isEmailValid} from '../../../shared/utils/email.utils';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetFulltexts} from './data-value.utils';
import {UserConstraintConditionValue} from '../data/constraint-condition';

export class UserDataValue implements DataValue {
  public readonly users: User[];

  constructor(
    public readonly value: any,
    public readonly config: UserConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    this.users = this.createUsers();
  }

  private createUsers(): User[] {
    const users = (this.constraintData && this.constraintData.users) || [];
    const userValues: any[] = (isArray(this.value) ? this.value : [this.value]).filter(
      val => isNotNullOrUndefined(val) && String(val).trim()
    );
    return userValues
      .map(userValue => {
        const user = users.find(u => u.email === userValue);
        if (user) {
          return user;
        }
        return {email: String(userValue), name: String(userValue), groupsMap: {}};
      })
      .filter(user => !!user);
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
    if (this.config && this.config.multi) {
      return this.users.map(user => user.email);
    }

    return this.users.length ? this.users[0].email : null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return true;
    }
    return !this.value || this.users.every(user => this.isUserValid(user));
  }

  private isUserValid(user: User): boolean {
    if (((this.constraintData && this.constraintData.users) || []).some(u => u.email === user.email)) {
      return true;
    }
    return this.config && this.config.externalUsers && isEmailValid(user.email);
  }

  public increment(): UserDataValue {
    return undefined; // not supported
  }

  public decrement(): UserDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: UserDataValue): number {
    if ((this.config && this.config.multi) || (otherValue.config && otherValue.config.multi)) {
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

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = values && values.map(value => this.mapQueryConditionValue(value));
    const otherUsers = dataValues && dataValues.length > 0 && dataValues[0].users;

    switch (condition) {
      case QueryCondition.In:
        return this.users.some(option => (otherUsers || []).some(otherOption => otherOption.email === option.email));
      case QueryCondition.NotIn:
        return this.users.every(option => (otherUsers || []).every(otherOption => otherOption.email !== option.email));
      case QueryCondition.IsEmpty:
        return this.users.length === 0 && this.format().trim().length === 0;
      case QueryCondition.NotEmpty:
        return this.users.length > 0 || this.format().trim().length > 0;
      default:
        return false;
    }
  }

  private mapQueryConditionValue(value: QueryConditionValue): UserDataValue {
    if (value.type && value.type === UserConstraintConditionValue.CurrentUser) {
      return this.copy(this.constraintData && this.constraintData.currentUser && this.constraintData.currentUser.email);
    }
    return this.copy(value.value);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return dataValuesMeetFulltexts(this.format(), fulltexts);
  }
}
