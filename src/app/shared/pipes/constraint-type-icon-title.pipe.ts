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

import {Pipe, PipeTransform} from '@angular/core';
import {Constraint} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../utils/translation.utils';

@Pipe({
  name: 'constraintTypeIconTitle',
})
export class ConstraintTypeIconTitlePipe implements PipeTransform {
  public transform(constraint: Constraint): string {
    if (!constraint) {
      return '';
    }

    return parseSelectTranslation(
      $localize`:@@constraint.type.icon.title:{constraintType, select, Text {Text} Number {Number} Address {Address} Boolean {Checkbox} Action {Action} Coordinates {Location} DateTime {Date and Time} Duration {Duration} Email {Email} Function {Function} Image {Image} Link {Link} Percentage {Percentage} Rating {Rating} Select {Selection} Tag {Tag} User {User selection} Color {Color}}`,
      {constraintType: constraint.type}
    );
  }
}
