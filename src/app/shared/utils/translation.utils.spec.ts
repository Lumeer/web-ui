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

import {parseSelectTranslation} from './translation.utils';

describe('translation utils', () => {
  it('should parse simple select', () => {
    expect(parseSelectTranslation('{unit, select, a {A} b {B} c {C}}', {unit: 'a'})).toEqual('A');
    expect(parseSelectTranslation('{unit, select, a {A} b {B} c {C}}', {unit: 'b'})).toEqual('B');
    expect(parseSelectTranslation('{unit, select, a {A} b {B} c {C}}', {unit: 'x'})).toEqual('');
  });

  it('should parse simple multiple selects', () => {
    expect(
      parseSelectTranslation(
        'Hello {unit, select, a {A} b {B} c {C}} text continues {unit, select, a {A} b {B} c {C}}',
        {unit: 'a'}
      )
    ).toEqual('Hello A text continues A');
  });
});
