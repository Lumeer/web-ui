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

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {PercentageConstraintConfig} from '../../../core/model/data/constraint';
import Big from 'big.js';
import {decimalUserToStore} from '../../utils/data.utils';

@Pipe({
  name: 'percentageValid',
})
@Injectable()
export class PercentageValidPipe implements PipeTransform {
  public transform(value: any, config?: PercentageConstraintConfig): boolean {
    if (!value || typeof value === 'number') {
      return true;
    }

    if (typeof value === 'string') {
      const text = decimalUserToStore(value.trim());

      const percChars = (text.match(/%/g) || []).length;
      if (percChars === 1 && text.endsWith('%')) {
        const prefix = text.substring(0, text.length - 1);
        return this.checkNumber(prefix, config);
      } else if (percChars === 0) {
        return this.checkNumber(text, config);
      }
    }

    return false;
  }

  private checkNumber(value: string, config?: PercentageConstraintConfig): boolean {
    if (!isNaN(+value)) {
      try {
        new Big(value);
      } catch (e) {
        return false;
      }

      return this.checkRange(+value, config);
    }

    return false;
  }

  private checkRange(n: number, config?: PercentageConstraintConfig) {
    let passed = true;
    if (config.minValue || config.minValue === 0) {
      passed = n >= config.minValue;
    }
    if (config.maxValue || config.maxValue === 0) {
      passed = passed && n <= config.maxValue;
    }

    return passed;
  }
}
