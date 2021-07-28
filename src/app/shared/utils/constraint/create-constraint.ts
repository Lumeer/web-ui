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

import {
  ActionConstraint,
  AddressConstraint,
  BooleanConstraint,
  ColorConstraint,
  Constraint,
  ConstraintType,
  CoordinatesConstraint,
  DateTimeConstraint,
  DurationConstraint,
  FilesConstraint,
  LinkConstraint,
  NumberConstraint,
  PercentageConstraint,
  SelectConstraint,
  TextConstraint,
  UnknownConstraint,
  UserConstraint,
  ViewConstraint,
} from '@lumeer/data-filters';

export function createConstraint(type: string, config: any): Constraint {
  switch (type) {
    case ConstraintType.Address:
      return new AddressConstraint(config);
    case ConstraintType.Boolean:
      return new BooleanConstraint();
    case ConstraintType.Action:
      return new ActionConstraint(config);
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
      return new LinkConstraint(config);
    case ConstraintType.View:
      return new ViewConstraint(config);
    default:
      return new UnknownConstraint();
  }
}
