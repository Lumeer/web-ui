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
import {DataValue} from './index';
import {isArray, isNotNullOrUndefined, unescapeHtml} from '../../../shared/utils/common.utils';
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {valueMeetFulltexts} from './data-value.utils';
import {arrayIntersection} from '../../../shared/utils/array.utils';
import {ConditionType, ConditionValue} from '../attribute-filter';

export class SelectDataValue implements DataValue {
  public readonly options: SelectConstraintOption[];

  constructor(
    public readonly value: any,
    public readonly config: SelectConstraintConfig,
    public readonly inputValue?: string
  ) {
    this.options = findOptionsByValue(config, value);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (this.options.length) {
      return this.options
        .map(option => (this.config?.displayValues ? option.displayValue || option.value : option.value))
        .join(', ');
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
      return this.options.map(option => option.value);
    }
    return this.options.length > 0 ? this.options[0].value : null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return true;
    }
    return !this.value || this.options.every(option => this.config.options.some(o => o.value === option.value));
  }

  public increment(): SelectDataValue {
    if (this.options.length === 0) {
      return null;
    }

    const nextOption = this.shiftOption(1, this.options[0]);
    return new SelectDataValue(nextOption.value, this.config);
  }

  public decrement(): SelectDataValue {
    if (this.options.length === 0) {
      return null;
    }

    const previousOption = this.shiftOption(-1, this.options[0]);
    return new SelectDataValue(previousOption.value, this.config);
  }

  public compareTo(otherValue: SelectDataValue): number {
    if (this.options.length > 1 || otherValue.options.length > 1) {
      return 0;
    }
    const {options} = this.config;
    const thisIndex = options.findIndex(option => this.options[0]?.value === option.value);
    const otherIndex = options.findIndex(option => otherValue.options[0]?.value === option.value);

    return thisIndex - otherIndex;
  }

  public copy(newValue?: any): SelectDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new SelectDataValue(value, this.config);
  }

  public parseInput(inputValue: string): SelectDataValue {
    return new SelectDataValue(this.value, this.config, inputValue);
  }

  private shiftOption(indexDelta: number, option: SelectConstraintOption): SelectConstraintOption {
    const {options} = this.config;
    const index = options.indexOf(option);
    const nextIndex = (index + indexDelta) % options.length;
    return options[nextIndex];
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new SelectDataValue(value.value, this.config));
    const otherOptions = (dataValues.length > 0 && dataValues[0].options) || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
        return this.options.some(option => otherOptions.some(otherOption => otherOption.value === option.value));
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        return this.options.every(option => otherOptions.every(otherOption => otherOption.value !== option.value));
      case ConditionType.In:
        return (
          this.options.length > 0 &&
          this.options.every(option => otherOptions.some(otherOption => otherOption.value === option.value))
        );
      case ConditionType.HasAll:
        return (
          arrayIntersection(
            otherOptions.map(o => o.value),
            this.options.map(o => o.value)
          ).length === otherOptions.length
        );
      case ConditionType.IsEmpty:
        return this.options.length === 0 && this.format().trim().length === 0;
      case ConditionType.NotEmpty:
        return this.options.length > 0 || this.format().trim().length > 0;
      default:
        return false;
    }
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    const dataValues = (values || []).map(value => new SelectDataValue(value.value, this.config));
    const otherOptions = (dataValues.length > 0 && dataValues[0].options) || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
      case ConditionType.In:
        return otherOptions[0].value;
      case ConditionType.HasAll:
        return values[0].value;
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        const noneOptions = (this.config?.options || []).filter(
          option => !otherOptions.some(otherOption => otherOption.value === option.value)
        );
        return noneOptions[0] && noneOptions[0].value;
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return this.config?.options?.[0]?.value;
      default:
        return null;
    }
  }
}

function findOptionsByValue(config: SelectConstraintConfig, value: any): SelectConstraintOption[] {
  const options = config?.options || [];
  const values: any[] = (isArray(value) ? value : [value]).filter(
    val => isNotNullOrUndefined(val) && String(val).trim()
  );
  return values
    .map(val => {
      const option = options.find(opt => String(opt.value) === String(val));
      if (option) {
        return {...option, displayValue: config?.displayValues ? option.displayValue : option.value};
      }

      return {value: val, displayValue: val};
    })
    .filter(option => !!option);
}
