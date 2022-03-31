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

import {ConstraintType, SelectDataValue} from '@lumeer/data-filters';
import {DropdownOption} from '../../dropdown/options/dropdown-option';

export function createSelectDataInputDropdownOptions(value: SelectDataValue): DropdownOption[] {
  const options = [...(value?.config?.options || [])];
  const optionsValues = new Set(options.map(option => option.value));
  (value?.options || []).forEach(option => {
    if (!optionsValues.has(option.value)) {
      options.push(option);
      optionsValues.add(option.value);
    }
  });

  const invalidValues = value?.constraintData?.invalidValuesMap?.[ConstraintType.Select];
  invalidValues?.forEach(value => {
    if (!optionsValues.has(value)) {
      options.push({value});
      optionsValues.add(value);
    }
  });
  return options.map(option => ({
    ...option,
    value: option.value,
    displayValue: value?.config.displayValues ? option.displayValue || option.value : option.value,
  }));
}
