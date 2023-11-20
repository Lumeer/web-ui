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

import {SelectConstraintConfig, SelectConstraintOption} from '@lumeer/data-filters';
import {UntypedFormArray} from '@angular/forms';
import {escapeHtml} from '@lumeer/utils';

export function isSelectConstraintOptionValueRemoved(
  previousConfig: SelectConstraintConfig,
  nextConfig: SelectConstraintConfig
): boolean {
  const previousValues = previousConfig.options.map(option => option.value);
  const nextValues = nextConfig.options.map(option => option.value);

  return previousValues.some(value => !nextValues.includes(value));
}

export function parseSelectOptionsFromForm(array: UntypedFormArray, displayValues: boolean): SelectConstraintOption[] {
  return array.value
    .filter(option => isSelectOptionValid(option, displayValues))
    .map(option => mapSelectOption(option, displayValues));
}

function isSelectOptionValid(option: any, displayValues: boolean): boolean {
  if (displayValues) {
    return option.value || option.value === 0;
  }
  return option.displayValue || option.displayValue === 0;
}

function mapSelectOption(option: any, displayValues: boolean): SelectConstraintOption {
  if (displayValues) {
    return {...option, value: escapeHtml(option.value), displayValue: escapeHtml(option.displayValue)};
  }
  return {...option, value: escapeHtml(option.displayValue), displayValue: undefined};
}
