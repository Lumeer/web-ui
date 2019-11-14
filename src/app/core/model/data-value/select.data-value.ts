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

import {SelectConstraintConfig, SelectConstraintOption} from '../data/constraint-config';
import {DataValue, DataValueInputType} from './index';

export class SelectDataValue implements DataValue {
  public readonly option: SelectConstraintOption;

  constructor(
    public readonly value: any,
    public readonly inputType: DataValueInputType,
    public readonly config: SelectConstraintConfig,
    byDisplayValue?: boolean
  ) {
    this.option = byDisplayValue ? findOptionByDisplayValue(config, value) : findOptionByValue(config, value);
  }

  public format(): string {
    if (this.option && this.config) {
      return (this.config.displayValues && this.option.displayValue) || this.option.value;
    }
    return this.value || '';
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return this.option ? this.option.value : this.value || '';
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return !!this.option;
  }

  public increment(): SelectDataValue {
    if (!this.option) {
      return null;
    }

    const nextOption = this.shiftOption(1);
    return new SelectDataValue(nextOption.value, DataValueInputType.Stored, this.config);
  }

  public decrement(): SelectDataValue {
    if (!this.option) {
      return null;
    }

    const previousOption = this.shiftOption(-1);
    return new SelectDataValue(previousOption.value, DataValueInputType.Stored, this.config);
  }

  public compareTo(otherValue: SelectDataValue): number {
    const {options} = this.config;
    const thisIndex = options.findIndex(option => this.option && this.option.value === option.value);
    const otherIndex = options.findIndex(option => otherValue.option && otherValue.option.value === option.value);

    return thisIndex - otherIndex;
  }

  public copy(newValue?: any): SelectDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new SelectDataValue(value, DataValueInputType.Copied, this.config);
  }

  public parseInput(inputValue: string): SelectDataValue {
    return new SelectDataValue(inputValue, DataValueInputType.Typed, this.config);
  }

  private shiftOption(indexDelta: number): SelectConstraintOption {
    const {options} = this.config;
    const index = options.indexOf(this.option);
    const nextIndex = (index + indexDelta) % options.length;
    return options[nextIndex];
  }
}

function findOptionByValue(config: SelectConstraintConfig, value: any): SelectConstraintOption {
  return config && config.options && config.options.find(opt => String(opt.value) === String(value));
}

function findOptionByDisplayValue(config: SelectConstraintConfig, value: any): SelectConstraintOption {
  return config && config.options && config.options.find(opt => String(opt.displayValue) === String(value));
}
