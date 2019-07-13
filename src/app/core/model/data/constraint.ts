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

import {AddressesMap} from '../../store/geocoding/address';
import {User} from '../../store/users/user';
import {ConstraintConfig} from './constraint-config';

export enum ConstraintType {
  Text = 'Text',
  Number = 'Number',
  Address = 'Address',
  Boolean = 'Boolean',
  Coordinates = 'Coordinates',
  DateTime = 'DateTime',
  Duration = 'Duration',
  Email = 'Email',
  Image = 'Image',
  Link = 'Link',
  Percentage = 'Percentage',
  Rating = 'Rating',
  Select = 'Select',
  Tag = 'Tag',
  User = 'User',
  Color = 'Color',
}

export const constraintTypesMap = {
  [ConstraintType.Address]: ConstraintType.Address,
  [ConstraintType.Boolean]: ConstraintType.Boolean,
  [ConstraintType.Color]: ConstraintType.Color,
  [ConstraintType.Coordinates]: ConstraintType.Coordinates,
  [ConstraintType.DateTime]: ConstraintType.DateTime,
  [ConstraintType.Duration]: ConstraintType.Duration,
  [ConstraintType.Email]: ConstraintType.Email,
  [ConstraintType.Image]: ConstraintType.Image,
  [ConstraintType.Link]: ConstraintType.Link,
  [ConstraintType.Number]: ConstraintType.Number,
  [ConstraintType.Percentage]: ConstraintType.Percentage,
  [ConstraintType.Rating]: ConstraintType.Rating,
  [ConstraintType.Select]: ConstraintType.Select,
  [ConstraintType.Tag]: ConstraintType.Tag,
  [ConstraintType.Text]: ConstraintType.Text,
  [ConstraintType.User]: ConstraintType.User,
};

export const constraintIconsMap = {
  [ConstraintType.Address]: 'fas fa-map-marker-alt',
  [ConstraintType.Boolean]: 'fas fa-check-square',
  [ConstraintType.Color]: 'fas fa-palette',
  [ConstraintType.Coordinates]: 'fas fa-location-circle',
  [ConstraintType.DateTime]: 'fas fa-calendar-day',
  [ConstraintType.Duration]: 'fas fa-stopwatch',
  [ConstraintType.Email]: 'fas fa-envelope',
  [ConstraintType.Image]: 'fas fa-file-image',
  [ConstraintType.Link]: 'fas fa-link',
  [ConstraintType.Number]: 'fas fa-pi',
  [ConstraintType.Percentage]: 'fas fa-percentage',
  [ConstraintType.Rating]: 'fas fa-star',
  [ConstraintType.Select]: 'fas fa-caret-square-down',
  [ConstraintType.Tag]: 'fas fa-tag',
  [ConstraintType.Text]: 'fas fa-font',
  [ConstraintType.User]: 'fas fa-user',
};

export function isConstraintTypeEnabled(type: string | ConstraintType): boolean {
  switch (type) {
    case ConstraintType.Address:
    case ConstraintType.Boolean:
    case ConstraintType.Color:
    case ConstraintType.Coordinates:
    case ConstraintType.DateTime:
    case ConstraintType.Duration:
    case ConstraintType.Number:
    case ConstraintType.Percentage:
    case ConstraintType.Select:
    case ConstraintType.Text:
    case ConstraintType.User:
      return true;
    default:
      return false;
  }
}

export interface Constraint {
  type: ConstraintType;
  config: Partial<ConstraintConfig>;
}

export interface ConstraintData {
  addressesMap?: AddressesMap;
  users: User[];
}
