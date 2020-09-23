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

import {Constraint} from '../../../core/model/constraint';
import {AddressConstraint} from '../../../core/model/constraint/address.constraint';
import {BooleanConstraint} from '../../../core/model/constraint/boolean.constraint';
import {ColorConstraint} from '../../../core/model/constraint/color.constraint';
import {CoordinatesConstraint} from '../../../core/model/constraint/coordinates.constraint';
import {DateTimeConstraint} from '../../../core/model/constraint/datetime.constraint';
import {DurationConstraint} from '../../../core/model/constraint/duration.constraint';
import {FilesConstraint} from '../../../core/model/constraint/files.constraint';
import {NumberConstraint} from '../../../core/model/constraint/number.constraint';
import {PercentageConstraint} from '../../../core/model/constraint/percentage.constraint';
import {SelectConstraint} from '../../../core/model/constraint/select.constraint';
import {TextConstraint} from '../../../core/model/constraint/text.constraint';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {UserConstraint} from '../../../core/model/constraint/user.constraint';
import {ConstraintType} from '../../../core/model/data/constraint';
import {LinkConstraint} from '../../../core/model/constraint/link.constraint';

export function createConstraint(type: string, config: any): Constraint {
  switch (type) {
    case ConstraintType.Address:
      return new AddressConstraint(config);
    case ConstraintType.Boolean:
      return new BooleanConstraint();
    case ConstraintType.Color:
      return new ColorConstraint(config);
    case ConstraintType.Coordinates:
      return new CoordinatesConstraint(config);
    case ConstraintType.DateTime:
      return new DateTimeConstraint(config);
    case ConstraintType.Duration:
      return new DurationConstraint(config);
    case ConstraintType.Files:
      return new FilesConstraint();
    case ConstraintType.Number:
      return new NumberConstraint(config);
    case ConstraintType.Percentage:
      return new PercentageConstraint(config);
    case ConstraintType.Select:
      return new SelectConstraint(config);
    case ConstraintType.Text:
      return new TextConstraint(config);
    case ConstraintType.User:
      return new UserConstraint(config);
    case ConstraintType.Link:
      return new LinkConstraint();
    default:
      return new UnknownConstraint();
  }
}
