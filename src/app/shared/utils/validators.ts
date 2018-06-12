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

import {FormControl} from '@angular/forms';


export const notEmptyValidator = () => {
  return (control: FormControl) => {
    const value = control.value && control.value.toString().trim();
    if (!value || value === '') {
      return {empty: {valid: false}};
    }
    return null;
  };
};

export const maxLengthValidator = (max: number) => {
  return (control: FormControl) => {
    const value = control.value && control.value.toString().trim();
    if (!value || value.length > max) {
      return {maxLength: {valid: false}};
    }
    return null;
  };
};

export const minLengthValidator = (min: number) => {
  return (control: FormControl) => {
    const value = control.value && control.value.toString().trim();
    if (!value || value.length < min) {
      return {minLength: {valid: false}};
    }
    return null;
  };
};
