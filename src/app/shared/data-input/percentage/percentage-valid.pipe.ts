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
      const text = value.trim();

      const percChars = (value.match(/%/g) || []).length;
      if (percChars === 1 && value.endsWith('%')) {
        const prefix = value.substring(0, value.length - 1);

        if (!isNaN(+prefix)) {
          return this.checkRange(+prefix, config);
        }
      } else if (percChars === 0) {
        if (!isNaN(+value)) {
          return this.checkRange(+value, config);
        }
      }
    }
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
