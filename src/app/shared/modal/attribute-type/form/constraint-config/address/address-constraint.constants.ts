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

import {LanguageCode} from '../../../../../top-panel/user-panel/user-menu/language';
import {Address, AddressField} from '@lumeer/data-filters';
import {Configuration} from '../../../../../../../environments/configuration-type';

const CZECH_DEFAULT_FIELDS = [AddressField.Street, AddressField.HouseNumber, AddressField.City, AddressField.Country];
const ENGLISH_DEFAULT_FIELDS = [
  AddressField.HouseNumber,
  AddressField.Street,
  AddressField.City,
  AddressField.State,
  AddressField.Country,
];

export function addressDefaultFields(configuration: Configuration) {
  return configuration.locale === LanguageCode.CZ ? CZECH_DEFAULT_FIELDS : ENGLISH_DEFAULT_FIELDS;
}

export function addressExample(configuration: Configuration) {
  return configuration.locale === LanguageCode.CZ ? CZECH_EXAMPLE_ADDRESS : ENGLISH_EXAMPLE_ADDRESS;
}

const CZECH_EXAMPLE_ADDRESS: Address = {
  houseNumber: '452/9',
  street: 'Lumírova',
  postalCode: '12800',
  city: 'Praha',
  country: 'Česká republika',
  continent: 'Evropa',
};

const ENGLISH_EXAMPLE_ADDRESS: Address = {
  houseNumber: '444',
  street: 'Castro Street',
  postalCode: '94041',
  city: 'Mountain View',
  state: 'CA',
  country: 'USA',
  continent: 'North America',
};
