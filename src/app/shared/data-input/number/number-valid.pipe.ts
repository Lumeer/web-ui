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
import {NumberConstraintConfig} from '../../../core/model/data/constraint';
import Big from 'big.js';
import {convertToBig} from '../../utils/data.utils';

@Pipe({
  name: 'numberValid',
})
@Injectable()
export class NumberValidPipe implements PipeTransform {
  public transform(value: any, config?: NumberConstraintConfig): boolean {
    if (!value) {
      return true;
    }
    const valueBig = convertToBig(value);
    if (!valueBig) {
      return false;
    }
    return this.checkRange(valueBig, config);
  }

  private checkRange(n: Big, config?: NumberConstraintConfig): boolean {
    let passed = true;
    if (config.minValue) {
      passed = n.gte(config.minValue);
    }
    if (config.maxValue) {
      passed = passed && n.lte(config.maxValue);
    }

    return passed;
  }
}
