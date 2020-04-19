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

import {
  deepObjectsEquals,
  escapeHtml,
  isNotNullOrUndefined,
  isObject,
  unescapeHtml,
} from '../../../shared/utils/common.utils';
import {Address, AddressField} from '../../store/geocoding/address';
import {ConstraintData} from '../data/constraint';
import {AddressConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByText, valueByConditionText, valueMeetFulltexts} from './data-value.utils';

export class AddressDataValue implements DataValue {
  public readonly address: Address;

  constructor(
    public readonly value: any,
    public readonly config: AddressConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    if (isObject(value)) {
      this.address = value;
    } else {
      const addressesMap = (constraintData && constraintData.addressesMap) || {};
      this.address = addressesMap[value] && addressesMap[value][0];
    }
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (!this.address) {
      return this.value || '';
    }

    const fields = (this.config && this.config.fields) || [];
    const nonEmptyFields = fields.filter(fieldName => !!this.address[fieldName]);
    const streetFields: string[] = [AddressField.HouseNumber, AddressField.Street];

    return nonEmptyFields.reduce((formattedAddress, fieldName, index) => {
      const fieldValue = this.address[fieldName];
      if (index === 0) {
        return fieldValue;
      }

      if (streetFields.includes(fieldName) && streetFields.includes(nonEmptyFields[index - 1])) {
        return formattedAddress.concat(' ', fieldValue);
      } else {
        return formattedAddress.concat(', ', fieldValue);
      }
    }, '');
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
    return escapeHtml(this.address ? this.format() : this.value);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true; // users can enter any text, address constraint just provides hints
  }

  public increment(): AddressDataValue {
    return undefined; // not supported
  }

  public decrement(): AddressDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: AddressDataValue): number {
    if (deepObjectsEquals(this.address, otherValue.address)) {
      return 0;
    }

    return String(this.value).localeCompare(String(otherValue.value), undefined, {sensitivity: 'base'});
  }

  public copy(newValue?: any): AddressDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new AddressDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): AddressDataValue {
    return new AddressDataValue(inputValue, this.config, this.constraintData, inputValue);
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new AddressDataValue(value.value, this.config, this.constraintData));
    const formattedValue = this.format().toLowerCase().trim();
    const otherFormattedValues = dataValues.map(dataValue => dataValue.format().toLowerCase().trim());
    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    return valueByConditionText(condition, values[0] && values[0].value);
  }
}
