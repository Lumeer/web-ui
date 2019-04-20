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

import {resetUnusedMomentPart} from './date.utils';
import * as moment from 'moment';

describe('resetUnusedMomentPart', () => {
  it('should keep everything', () => {
    const date = moment('2019-04-19T20:32:00.000Z');
    const result = resetUnusedMomentPart(date, 'YYYY-MM-DD HH:mm');
    expect(result.toISOString()).toEqual('2019-04-19T20:32:00.000Z');
  });

  it('should reset date', () => {
    const date = moment('2019-04-19T20:32:00.000Z').utc();
    const result = resetUnusedMomentPart(date, 'HH:mm');
    expect(result.toISOString()).toEqual('1970-01-01T20:32:00.000Z');
  });

  it('should reset time', () => {
    const date = moment('2019-04-19T20:32:00.000Z').utc();
    const result = resetUnusedMomentPart(date, 'YYYY-MM-DD');
    expect(result.toISOString()).toEqual('2019-04-19T00:00:00.000Z');
  });
});
