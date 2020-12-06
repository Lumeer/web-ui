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

import {ActionConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {valueMeetFulltexts} from './data-value.utils';
import {ConditionType, ConditionValue} from '../attribute-filter';

export class ActionDataValue implements DataValue {
  public readonly value = null;

  constructor(public readonly config: ActionConstraintConfig) {}

  public format(): string {
    return '';
  }

  public preview(): string {
    return this.format();
  }

  public title(): string {
    return this.config.title;
  }

  public editValue(): string {
    return this.format();
  }

  public serialize(): any {
    return null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true; // any value can be converted to boolean
  }

  public decrement(): ActionDataValue {
    return undefined; // not supported
  }

  public increment(): ActionDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: ActionDataValue): number {
    return 0;
  }

  public copy(newValue?: any): ActionDataValue {
    return new ActionDataValue(this.config);
  }

  public parseInput(inputValue: string): ActionDataValue {
    return new ActionDataValue(this.config);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    return true;
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.title(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return true;
  }
}
