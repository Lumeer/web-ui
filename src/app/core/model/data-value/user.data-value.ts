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
import {isArray, isNotNullOrUndefined, unescapeHtml} from '../../../shared/utils/common.utils';
import {isEmailValid} from '../../../shared/utils/email.utils';
import {valueMeetFulltexts} from './data-value.utils';
import {UserConstraintConditionValue} from '../data/constraint-condition';
import {arrayIntersection} from '../../../shared/utils/array.utils';
import {ConditionType, ConditionValue} from '../attribute-filter';

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

  public format(preferEmail?: boolean): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (this.users.length) {
      return this.users.map(user => (preferEmail ? user.email || user.name : user.name || user.email)).join(', ');
    }

    return formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public title(): string {
    return unescapeHtml(this.format());
  }

  public editValue(): string {
    return unescapeHtml(this.format());
  }

  public serialize(): any {
    if (this.config?.multi) {
      return this.users.map(user => user.email);
    }

    return this.users?.[0]?.email || null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return true;
    }
    return !this.value || this.users.every(user => this.isUserValid(user));
  }

  private isUserValid(user: User): boolean {
    if (this.constraintData?.users?.some(u => u.email === user.email)) {
      return true;
    }
    return this.config?.externalUsers && isEmailValid(user.email);
  }

  public increment(): UserDataValue {
    return undefined; // not supported
  }

  public decrement(): UserDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: UserDataValue): number {
    if (this.users.length > 1 || otherValue.users.length > 1) {
      return 0;
    }

    if (this.users[0] && otherValue.users[0]) {
      return (this.users[0].name || this.users[0].email).localeCompare(
        otherValue.users[0].name || otherValue.users[0].email
      );
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

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherUsers = (dataValues.length > 0 && dataValues[0].users) || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
        return this.users.some(option => (otherUsers || []).some(otherOption => otherOption.email === option.email));
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        return this.users.every(option => (otherUsers || []).every(otherOption => otherOption.email !== option.email));
      case ConditionType.In:
        return (
          this.users.length > 0 &&
          this.users.every(user => otherUsers.some(otherOption => otherOption.email === user.email))
        );
      case ConditionType.HasAll:
        return (
          arrayIntersection(
            otherUsers.map(o => o.email),
            this.users.map(o => o.email)
          ).length === otherUsers.length
        );
      case ConditionType.IsEmpty:
        return this.users.length === 0 && this.format().trim().length === 0;
      case ConditionType.NotEmpty:
        return this.users.length > 0 || this.format().trim().length > 0;
      default:
        return false;
    }
  }

  private mapQueryConditionValue(value: ConditionValue): UserDataValue {
    if (value.type === UserConstraintConditionValue.CurrentUser) {
      const currentUser = this.constraintData?.currentUser;
      return new UserDataValue(currentUser && currentUser.email, this.config, this.constraintData);
    }
    return new UserDataValue(value.value, this.config, this.constraintData);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherUsers = (dataValues.length > 0 && dataValues[0].users) || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
      case ConditionType.In:
        return otherUsers?.[0]?.email;
      case ConditionType.HasAll:
        return values[0].value;
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        const noneOptions = (this.constraintData?.users || []).filter(
          user => !otherUsers.some(otherUser => otherUser.email === user.email)
        );
        return noneOptions?.[0]?.email;
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return this.constraintData?.users?.[0]?.email;
      default:
        return null;
    }
  }
}
