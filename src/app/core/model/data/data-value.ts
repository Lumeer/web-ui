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

export interface AddressValue {
  street: string;
  zip: string;
  city: string;
  county: string;
  state: string;
  country: string;
  continent: string;
}

export type BooleanValue = boolean;

export interface CoordinatesValue {
  lat: number;
  lng: number;
}

export type DateTimeValue = string;

export type DecimalValue = string;

export type EmailValue = string;

export type FunctionValue = undefined;

export type ImageValue = string; // url

export type IntegerValue = number; // TODO BigInt

export interface LinkValue {
  text: string;
  url: string;
}

export type PercentageValue = string;

export type RatingValue = number;

export type SelectValue = string;

export type TagValue = string;

export type TextValue = string;

export type UserValue = string; // user ID

export type DataValue =
  | AddressValue
  | BooleanValue
  | CoordinatesValue
  | DateTimeValue
  | DecimalValue
  | EmailValue
  | FunctionValue
  | ImageValue
  | IntegerValue
  | LinkValue
  | PercentageValue
  | RatingValue
  | SelectValue
  | TagValue
  | TextValue
  | UserValue;
