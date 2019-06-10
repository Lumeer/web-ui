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

import {getOtherDocumentIdFromLinkInstance} from './link-instance.utils';
import {LinkInstance} from './link.instance';

describe('getOtherDocumentIdFromLinkInstance()', () => {
  const linkInstance: LinkInstance = {
    documentIds: ['a', 'b'],
    linkTypeId: 'c',
    data: {},
  };

  it('should get first documentId', () => {
    expect(getOtherDocumentIdFromLinkInstance(linkInstance, 'b')).toEqual('a');
  });

  it('should get second documentId', () => {
    expect(getOtherDocumentIdFromLinkInstance(linkInstance, 'a')).toEqual('b');
  });

  it('should get first documentId if none matches', () => {
    expect(getOtherDocumentIdFromLinkInstance(linkInstance, 'c')).toEqual('a');
  });

  it('should get first documentId by multiple', () => {
    expect(getOtherDocumentIdFromLinkInstance(linkInstance, 'c', 'b')).toEqual('a');
  });

  it('should get second documentId by multiple', () => {
    expect(getOtherDocumentIdFromLinkInstance(linkInstance, 'a', 'c')).toEqual('b');
  });

  it('should get first documentId if none matches by multiple', () => {
    expect(getOtherDocumentIdFromLinkInstance(linkInstance, 'c', 'd')).toEqual('a');
  });
});
