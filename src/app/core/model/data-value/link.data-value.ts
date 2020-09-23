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

import {DataValue} from './index';
import {LinkConstraintConfig} from '../data/constraint-config';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';

export class LinkDataValue implements DataValue {
  public readonly config: LinkConstraintConfig = {};

  constructor(public readonly value: string, public readonly inputValue?: string) {}

  public compareTo(otherValue: DataValue): number {
    return 0;
  }

  public copy(newValue?: any): DataValue {
    return undefined;
  }

  public decrement(): DataValue {
    return undefined;
  }

  public editValue(): string {
    return '';
  }

  public format(): string {
    return '';
  }

  public increment(): DataValue {
    return undefined;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return false;
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    return false;
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return false;
  }

  public parseInput(inputValue: string): DataValue {
    return undefined;
  }

  public preview(): string {
    return '';
  }

  public serialize(): any {
    return '';
  }

  public title(): string {
    return '';
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    return undefined;
  }
}
