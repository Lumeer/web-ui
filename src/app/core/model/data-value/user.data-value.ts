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
import {DataValue, DataValueInputType} from './index';

export class UserDataValue implements DataValue {
  public readonly user: User;

  constructor(
    public readonly value: any,
    public readonly inputType: DataValueInputType,
    public readonly config: UserConstraintConfig,
    public readonly constraintData: ConstraintData
  ) {
    const email = String(value).trim();
    this.user = ((constraintData && constraintData.users) || []).find(user => user.email === email);
  }

  public format(): string {
    if (this.user) {
      return this.user.name || this.user.email;
    }

    if (
      this.inputType === DataValueInputType.Typed ||
      (this.config && this.config.externalUsers && isEmailValid(String(this.value)))
    ) {
      return String(this.value);
    }

    return formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    if (this.user) {
      return this.user.email;
    }

    if (
      this.inputType === DataValueInputType.Typed ||
      (this.config && this.config.externalUsers && isEmailValid(String(this.value)))
    ) {
      return String(this.value);
    }

    return '';
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (this.user) {
      return true;
    }

    return Boolean(this.config) && this.config.externalUsers && isEmailValid(String(this.value));
  }

  public increment(): UserDataValue {
    return undefined; // not supported
  }

  public decrement(): UserDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: UserDataValue): number {
    if (this.user && otherValue.user) {
      this.user.email.localeCompare(otherValue.user.email);
    }

    return String(this.value).localeCompare(String(otherValue.value));
  }

  public copy(newValue?: any): UserDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new UserDataValue(value, DataValueInputType.Copied, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): UserDataValue {
    return new UserDataValue(inputValue, DataValueInputType.Typed, this.config, this.constraintData);
  }
}
