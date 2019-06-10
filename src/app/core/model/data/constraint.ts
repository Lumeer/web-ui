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

import Big from 'big.js';
import {User} from '../../store/users/user';
import {ColumnFunction} from './column-function';

export enum ConstraintType {
  Text = 'Text',
  Number = 'Number',
  Address = 'Address',
  Boolean = 'Boolean',
  Coordinates = 'Coordinates',
  DateTime = 'DateTime',
  Email = 'Email',
  Function = 'Function',
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
  [ConstraintType.Coordinates]: ConstraintType.Coordinates,
  [ConstraintType.DateTime]: ConstraintType.DateTime,
  [ConstraintType.Email]: ConstraintType.Email,
  [ConstraintType.Function]: ConstraintType.Function,
  [ConstraintType.Image]: ConstraintType.Image,
  [ConstraintType.Link]: ConstraintType.Link,
  [ConstraintType.Number]: ConstraintType.Number,
  [ConstraintType.Percentage]: ConstraintType.Percentage,
  [ConstraintType.Rating]: ConstraintType.Rating,
  [ConstraintType.Select]: ConstraintType.Select,
  [ConstraintType.Tag]: ConstraintType.Tag,
  [ConstraintType.Text]: ConstraintType.Text,
  [ConstraintType.User]: ConstraintType.User,
  [ConstraintType.Color]: ConstraintType.Color,
};

export function isConstraintTypeEnabled(type: string | ConstraintType): boolean {
  switch (type) {
    case ConstraintType.Boolean:
    case ConstraintType.Color:
    case ConstraintType.DateTime:
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

export interface AddressConstraintConfig {
  fields: {
    street: boolean;
    zip: boolean;
    city: boolean;
    county: boolean;
    state: boolean;
    country: boolean;
    continent: boolean;
  };
}

export enum CoordinatesFormat {
  DecimalDegrees = 'DD',
  DegreesMinutesSeconds = 'DMS',
}

export interface CoordinatesConstraintConfig {
  format: CoordinatesFormat;
  precision: number;
}

export interface DateTimeConstraintConfig {
  format: string;
  minValue: Date;
  maxValue: Date;
  range: boolean;
}

export interface FunctionConstraintConfig {
  function: ColumnFunction;
}

export interface NumberConstraintConfig {
  decimal: boolean;
  format: string;
  minValue: Big;
  maxValue: Big;
  precision: number;
}

export interface PercentageConstraintConfig {
  format: string;
  decimals: number;
  minValue: number;
  maxValue: number;
}

export interface RatingConstraintConfig {
  icon: string;
  text: boolean;
  minValue: number;
  maxValue: number;
}

export interface SelectConstraintOption {
  displayValue?: string;
  icon?: string;
  value: string;
}

export interface SelectConstraintConfig {
  displayValues: boolean;
  options: SelectConstraintOption[];
}

export interface TagConstraintConfig {
  options: string[];
}

export enum CaseStyle {
  None = 'None',
  LowerCase = 'LowerCase',
  UpperCase = 'UpperCase',
  TitleCase = 'TitleCase',
  SentenceCase = 'SentenceCase',
}

export interface TextConstraintConfig {
  caseStyle: CaseStyle;
  minLength: number;
  maxLength: number;
  regexp: string;
}

export interface UserConstraintConfig {
  externalUsers: boolean;
}

export interface ColorConstraintConfig {}

export type ConstraintConfig =
  | AddressConstraintConfig
  | CoordinatesConstraintConfig
  | DateTimeConstraintConfig
  | FunctionConstraintConfig
  | NumberConstraintConfig
  | PercentageConstraintConfig
  | RatingConstraintConfig
  | SelectConstraintConfig
  | TagConstraintConfig
  | TextConstraintConfig
  | UserConstraintConfig
  | ColorConstraintConfig;

export interface Constraint {
  type: ConstraintType;
  config: Partial<ConstraintConfig>;
}

export interface ConstraintData {
  users: User[];
}
