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
import {Constraint, ConstraintType, TextConstraint} from '@lumeer/data-filters';

@Pipe({
  name: 'constraintClass',
})
export class ConstraintClassPipe implements PipeTransform {
  public transform(constraint: Constraint): string {
    const type = (constraint || new TextConstraint({})).type;
    return constraintTypeClass(type !== ConstraintType.Unknown ? type : ConstraintType.Text);
  }
}

export function constraintTypeClass(type: ConstraintType): string {
  return `${(type || ConstraintType.Text).toLowerCase()}-input`;
}
