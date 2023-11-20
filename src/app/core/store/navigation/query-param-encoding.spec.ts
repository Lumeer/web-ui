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
import {decodeQueryParam, encodeQueryParam} from './query-param-encoding';

describe('encodeQueryParam()', () => {
  it('should handle empty query', () => {
    expect(encodeQueryParam('')).toEqual('');
  });

  it('should handle empty query object', () => {
    expect(encodeQueryParam('{}')).toEqual('');
  });

  it('should handle query object', () => {
    expect(encodeQueryParam('{"s":[{"c":"5d24b3632ec57b390456ed06"}]}')).toEqual(
      'eyJzIjpbeyJjIjoiNWQyNGIzNjMyZWM1N2IzOTA0NTZlZDA2In1dfQc809164d'
    );
  });
});

describe('decodeQueryParam()', () => {
  it('should handle empty query', () => {
    expect(decodeQueryParam('')).toEqual('');
  });

  it('should handle single query stem', () => {
    expect(decodeQueryParam('eyJzIjpbeyJjIjoiNWQyNGIzNjMyZWM1N2IzOTA0NTZlZDA2In1dfQc809164d')).toEqual(
      '{"s":[{"c":"5d24b3632ec57b390456ed06"}]}'
    );
  });

  it('should handle invalid query', () => {
    expect(decodeQueryParam('eyJzIjpbeyJjIjoiNWQyNGIzNjMyZWM1N2xzIzOTA0NTZlZDA2In1dfQc809164d')).toEqual('');
  });
});
