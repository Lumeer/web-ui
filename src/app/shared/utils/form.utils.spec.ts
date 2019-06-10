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

import {FormArray, FormControl} from '@angular/forms';
import {moveFormArrayItem} from './form.utils';

describe('moveFormArrayItem', () => {
  it('should move item down', () => {
    const formArray = createFormArray(4);
    moveFormArrayItem(formArray, 0, 1);
    expect(formArray.value).toEqual([2, 1, 3, 4]);
  });

  it('should move item up', () => {
    const formArray = createFormArray(4);
    moveFormArrayItem(formArray, 2, 1);
    expect(formArray.value).toEqual([1, 3, 2, 4]);
  });
});

function createFormArray(controls: number): FormArray {
  return new FormArray(
    new Array(controls)
      .fill(0)
      .map((value, index) => index + 1)
      .map(index => new FormControl(index))
  );
}
