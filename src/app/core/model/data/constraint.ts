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
  Decimal = 'Decimal',
  Email = 'Email',
  Function = 'Function',
  Image = 'Image',
  Integer = 'Integer',
  Link = 'Link',
  Percentage = 'Percentage',
  Rating = 'Rating',
  Select = 'Select',
  Tag = 'Tag',
  Text = 'Text',
  User = 'User',
}

export interface AddressConstraint {
  type: ConstraintType.Address;
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

export interface BooleanConstraint {
  type: ConstraintType.Boolean;
}

export enum CoordinatesFormat {
  DecimalDegrees = 'DD',
  DegreesMinutesSeconds = 'DMS',
}

export interface CoordinatesConstraint {
  type: ConstraintType.Coordinates;
  format: CoordinatesFormat;
  precision: number;
}

export interface DateTimeConstraint {
  type: ConstraintType.DateTime;
  format: string; // TODO maybe restrict to enum
}

export interface DecimalConstraint {
  type: ConstraintType.Decimal;
  format: string;
}

export interface EmailConstraint {
  type: ConstraintType.Decimal;
}

export interface FunctionConstraint {
  type: ConstraintType.Function;
  function: ColumnFunction;
}

export interface ImageConstraint {
  type: ConstraintType.Image;
}

export interface IntegerConstraint {
  type: ConstraintType.Integer;
  format: string;
}

export interface LinkConstraint {
  type: ConstraintType.Link;
}

export interface PercentageConstraint {
  type: ConstraintType.Percentage;
  format: string;
  minValue: number;
  maxValue: number;
}

export interface RatingConstraint {
  type: ConstraintType.Rating;
  icon: string;
  text: boolean;
  minValue: number;
  maxValue: number;
}

export interface SelectOption {
  text: string;
  icon: string;
}

export interface SelectConstraint {
  type: ConstraintType.Select;
  defaultOptionIndex: number;
  options: SelectOption[];
}

export interface TagConstraint {
  type: ConstraintType.Tag;
  options: string[];
}

export enum CaseStyle {
  None = 'None',
  LowerCase = 'LowerCase',
  UpperCase = 'UpperCase',
  TitleCase = 'TitleCase',
  SentenceCase = 'SentenceCase',
}

export interface TextConstraint {
  type: ConstraintType.Text;
  caseStyle: CaseStyle;
  minLength: number;
  maxLength: number;
  regexp: string;
}

export interface UserConstraint {
  type: ConstraintType.User;
  email: boolean;
  name: boolean;
}

export type Constraint =
  | AddressConstraint
  | BooleanConstraint
  | CoordinatesConstraint
  | DateTimeConstraint
  | DecimalConstraint
  | EmailConstraint
  | FunctionConstraint
  | ImageConstraint
  | IntegerConstraint
  | LinkConstraint
  | PercentageConstraint
  | RatingConstraint
  | SelectConstraint
  | TagConstraint
  | TextConstraint
  | UserConstraint;
