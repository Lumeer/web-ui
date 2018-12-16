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

import {ColumnFunction} from './column-function';

export enum ConstraintType {
  Address = 'Address',
  Boolean = 'Boolean',
  Coordinates = 'Coordinates',
  DateTime = 'DateTime',
  Email = 'Email',
  Function = 'Function',
  Image = 'Image',
  Link = 'Link',
  Number = 'Number',
  Percentage = 'Percentage',
  Rating = 'Rating',
  Select = 'Select',
  Tag = 'Tag',
  Text = 'Text',
  User = 'User',
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
};

export const ENABLED_CONSTRAINTS: string[] = [ConstraintType.DateTime, ConstraintType.Number, ConstraintType.Text];

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
  minDateTime: Date;
  maxDateTime: Date;
  range: boolean;
}

export interface FunctionConstraintConfig {
  function: ColumnFunction;
}

export interface NumberConstraintConfig {
  decimal: boolean;
  format: string;
  minValue: number; // TODO use BigInt
  maxValue: number; // TODO use BigInt
  precision: number;
}

export interface PercentageConstraintConfig {
  format: string;
  minValue: number;
  maxValue: number;
}

export interface RatingConstraintConfig {
  icon: string;
  text: boolean;
  minValue: number;
  maxValue: number;
}

export interface SelectOption {
  text: string;
  icon: string;
}

export interface SelectConstraintConfig {
  defaultOptionIndex: number;
  options: SelectOption[];
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
  email: boolean;
  name: boolean;
}

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
  | UserConstraintConfig;

export interface Constraint {
  type: ConstraintType;
  config: Partial<ConstraintConfig>;
}
