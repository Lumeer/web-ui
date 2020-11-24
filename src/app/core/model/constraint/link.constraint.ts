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

import {ConstraintType} from '../data/constraint';
import {Constraint} from './index';
import {QueryCondition} from '../../store/navigation/query/query';
import {LinkDataValue} from '../data-value/link.data-value';
import {LinkConstraintConfig} from '../data/constraint-config';

export class LinkConstraint implements Constraint {
  public readonly type = ConstraintType.Link;
  public readonly isTextRepresentation = false;

  constructor(public readonly config: LinkConstraintConfig) {}

  public createDataValue(value: any): LinkDataValue {
    return new LinkDataValue(value, this.config);
  }

  public createInputDataValue(inputValue: string, value: any): LinkDataValue {
    return new LinkDataValue(value, this.config, inputValue);
  }

  public conditions(): QueryCondition[] {
    return [QueryCondition.Equals, QueryCondition.NotEquals, QueryCondition.IsEmpty, QueryCondition.NotEmpty];
  }
}
