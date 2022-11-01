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

import {UntypedFormControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import {isNullOrUndefined} from '../../shared/utils/common.utils';

export function notEmptyValidator(): ValidatorFn {
  return (control: UntypedFormControl): ValidationErrors | null => {
    return String(control.value || '').trim() ? null : {notEmpty: true};
  };
}

export function integerValidator(): ValidatorFn {
  return (control: UntypedFormControl): ValidationErrors | null => {
    const value = control.value;

    if (isNullOrUndefined(value)) {
      return null;
    }
    if (!Number.isInteger(value)) {
      return {invalid: true};
    }
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      return {invalidRange: true};
    }

    return null;
  };
}

export function minLengthValidator(length: number): ValidatorFn {
  return (control: UntypedFormControl): ValidationErrors | null => {
    return String(control.value || '').trim().length >= length ? null : {minLength: true};
  };
}
