/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {FormControl, FormGroup} from '@angular/forms';
import {minMaxValidator} from './validators';

describe('minMaxValidator', () => {
  beforeEach(() => {
    this.form = new FormGroup({
      min: new FormControl(),
      max: new FormControl(),
    });
    this.min = this.form.get('min');
    this.max = this.form.get('max');
  });

  it('should not fail if minimum form control does not exist', () => {
    expect(minMaxValidator('minimum', 'max')(this.form)).toBeNull();
  });

  it('should not fail if maximum form control does not exist', () => {
    expect(minMaxValidator('min', 'maximum')(this.form)).toBeNull();
  });

  it('should not produce error if min is not set', () => {
    this.max.setValue(2);
    expect(minMaxValidator('min', 'max')(this.form)).toBeNull();
  });

  it('should not produce error if max is not set', () => {
    this.min.setValue(1);
    expect(minMaxValidator('min', 'max')(this.form)).toBeNull();
  });

  it('should not produce error if min is less than max', () => {
    this.min.setValue(1);
    this.max.setValue(2);
    expect(minMaxValidator('min', 'max')(this.form)).toBeNull();
  });

  it('should not produce error if min is equal to max', () => {
    this.min.setValue(2);
    this.max.setValue(2);
    expect(minMaxValidator('min', 'max')(this.form)).toBeNull();
  });

  it('should produce error if min is greater than max', () => {
    this.min.setValue(2);
    this.max.setValue(1);
    expect(minMaxValidator('min', 'max')(this.form)).toEqual({minMaxInvalid: true});
  });
});
