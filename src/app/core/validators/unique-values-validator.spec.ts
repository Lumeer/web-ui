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
import {UntypedFormArray, UntypedFormControl, UntypedFormGroup} from '@angular/forms';

import {uniqueValuesValidator} from './unique-values-validator';

describe('uniqueValuesValidator', () => {
  it('should be valid on empty form array', () => {
    expect(uniqueValuesValidator('value')(createFormArray())).toBeNull();
  });

  it('should be valid if value control does not exist', () => {
    expect(uniqueValuesValidator('displayValue')(createFormArray('value', 'aaa', 'aaa'))).toBeNull();
  });

  it('should be valid in case of single control', () => {
    expect(uniqueValuesValidator('value')(createFormArray('value', 'aaa'))).toBeNull();
  });

  it('should be valid if two values are different', () => {
    expect(uniqueValuesValidator('value')(createFormArray('value', 'aaa', 'bbb'))).toBeNull();
  });

  it('should be invalid if two values are same', () => {
    expect(uniqueValuesValidator('value')(createFormArray('value', 'aaa', 'bbb', 'aaa'))).toEqual({
      uniqueValues: true,
    });
  });

  it('should be valid if skipping empty and two values are empty', () => {
    expect(uniqueValuesValidator('value', true)(createFormArray('value', '', ''))).toBeNull();
  });

  it('should be invalid if not skipping empty and two values are empty', () => {
    expect(uniqueValuesValidator('value')(createFormArray('value', '', ''))).toEqual({
      uniqueValues: true,
    });
  });
});

function createFormArray(controlName?: string, ...values: any[]): UntypedFormArray {
  return new UntypedFormArray(
    values.map(
      value =>
        new UntypedFormGroup({
          [controlName]: new UntypedFormControl(value),
        })
    )
  );
}
