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

export interface Constraints {
  type: string;
  color: string;
  list: string[];
}

export const constraints: Constraints[] = [
  {
    type: 'numeric',
    color: '#5c93ff',
    list: [
      'Number',
      '=',
      '>=',
      '<=',
      '<',
      '>',
      'RoundedTo:',
      'Decimal',
      'Odd',
      'Even',
      'LessThan:',
      'MoreThan:',
      'Prime',
      'MultipleOf:',
    ],
  },
  {
    type: 'text',
    color: '#ff513e',
    list: [
      'Word',
      'ShorterThan:',
      'LongerThan:',
      'HasWords:',
      'WordCount:',
      'ContainsNumbers:',
      'Uppercase',
      'Lowercase',
      'StartsWith:',
      'EndsWith:',
      'NoPunctuation',
    ],
  },
  {
    type: 'special',
    color: '#6bf643',
    list: [
      'FullName',
      'Name',
      'Date',
      'Time',
      'Money',
      'OneOf:',
      'Gender',
      'Person',
      'Address',
      'Email',
      'Phone',
      'Fax',
    ],
  },
];
