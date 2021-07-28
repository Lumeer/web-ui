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

import {escapeStringForRegex, transformTextToSentenceCase, transformTextToTitleCase} from './string.utils';

describe('escapeStringForRegex()', () => {
  it('should escape two plus signs', () => {
    expect(escapeStringForRegex('C++')).toEqual('C\\+\\+');
  });
});

describe('transformTextToTitleCase()', () => {
  it('should change only first letters of words', () => {
    expect(transformTextToTitleCase('hTC desire sV')).toEqual('HTC Desire SV');
  });
  it('should not modify digits', () => {
    expect(transformTextToTitleCase('nokia 7.1')).toEqual('Nokia 7.1');
  });
});

describe('transformTextToSentenceCase()', () => {
  it('should change only first character of first word', () => {
    expect(transformTextToSentenceCase('hello world')).toEqual('Hello world');
  });

  it('should properly format sentences', () => {
    expect(transformTextToSentenceCase('hello!how are you?')).toEqual('Hello! How are you?');
  });
});
