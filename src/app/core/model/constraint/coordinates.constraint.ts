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

import {CoordinatesDataValue} from '../data-value/coordinates.data-value';
import {ConstraintType} from '../data/constraint';
import {CoordinatesConstraintConfig} from '../data/constraint-config';
import {Constraint} from './index';
import {DataValueInputType} from '../data-value';
import {QueryCondition} from '../../store/navigation/query/query';

export class CoordinatesConstraint implements Constraint {
  public readonly type = ConstraintType.Coordinates;

  constructor(public readonly config: CoordinatesConstraintConfig) {}

  public createDataValue(value: any, inputType: DataValueInputType = DataValueInputType.Stored): CoordinatesDataValue {
    return new CoordinatesDataValue(value, inputType, this.config);
  }

  public conditions(): QueryCondition[] {
    return [QueryCondition.Equals, QueryCondition.NotEquals, QueryCondition.IsEmpty, QueryCondition.NotEmpty];
  }
}
