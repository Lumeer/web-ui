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

import {UntypedFormArray, ValidationErrors, ValidatorFn} from '@angular/forms';
import {isNumeric, toNumber, uniqueValues} from '@lumeer/utils';

export function uniqueValuesValidator(valueControlName: string, skipEmpty?: boolean): ValidatorFn {
  return (formArray: UntypedFormArray): ValidationErrors | null => {
    const values = formArray.controls
      .map(form => form.get(valueControlName))
      .filter(control => !!control)
      .map(control => control.value)
      .filter(value => !skipEmpty || value || value === 0)
      .map(value => (isNumeric(value) ? toNumber(value) : value));
    return values.length !== uniqueValues(values).length ? {uniqueValues: true} : null;
  };
}
