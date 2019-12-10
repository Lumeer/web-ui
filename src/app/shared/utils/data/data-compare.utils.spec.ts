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

import {DateTimeConstraint} from '../../../core/model/constraint/datetime.constraint';
import {DateTimeConstraintConfig} from '../../../core/model/data/constraint-config';
import {dataValuesMeetCondition} from './data-compare.utils';
import {QueryCondition} from '../../../core/store/navigation/query/query';

describe('Data values meet condition', () => {
  it('should compare by date only year constraint', () => {
    const constraint = new DateTimeConstraint({format: 'YYYY'} as DateTimeConstraintConfig);

    expect(dataValuesMeetCondition("2019-04-10'T'09:40:10.031Z", null, QueryCondition.Equals, constraint)).toEqual(
      false
    );
    expect(dataValuesMeetCondition("2019-04-10'T'09:40:10.031Z", null, QueryCondition.NotEquals, constraint)).toEqual(
      true
    );
    expect(
      dataValuesMeetCondition(undefined, "2019-04-13'T'10:32:01.000Z", QueryCondition.NotEquals, constraint)
    ).toEqual(true);
    expect(dataValuesMeetCondition(null, undefined, QueryCondition.Equals, constraint)).toEqual(true);

    expect(
      dataValuesMeetCondition(
        "2019-04-10'T'09:40:10.031Z",
        "2019-04-13'T'10:32:01.000Z",
        QueryCondition.Equals,
        constraint
      )
    ).toEqual(true);
    expect(
      dataValuesMeetCondition(
        "2019-04-10'T'09:40:10.031Z",
        "2020-04-13'T'10:32:01.000Z",
        QueryCondition.Equals,
        constraint
      )
    ).toEqual(false);
    expect(
      dataValuesMeetCondition(
        "2019-04-10'T'09:40:10.031Z",
        "2020-04-13'T'10:32:01.000Z",
        QueryCondition.LowerThan,
        constraint
      )
    ).toEqual(true);
    expect(
      dataValuesMeetCondition(
        "2019-01-10'T'00:00:00.031Z",
        "2019-09-23'T'18:32:01.000Z",
        QueryCondition.LowerThanEquals,
        constraint
      )
    ).toEqual(true);
    expect(
      dataValuesMeetCondition(
        "2019-01-10'T'00:00:00.031Z",
        "2019-09-23'T'18:32:01.000Z",
        QueryCondition.GreaterThanEquals,
        constraint
      )
    ).toEqual(true);
    expect(
      dataValuesMeetCondition(
        "2019-01-10'T'00:00:00.031Z",
        "2019-09-23'T'18:32:01.000Z",
        QueryCondition.Equals,
        constraint
      )
    ).toEqual(true);
    expect(
      dataValuesMeetCondition(
        "2020-01-10'T'00:00:00.031Z",
        "2019-09-23'T'18:32:01.000Z",
        QueryCondition.GreaterThan,
        constraint
      )
    ).toEqual(true);
  });

  it('should compare by date only year and month constraint', () => {
    const formats = ['YYYY/MM', 'MM.YYYY', 'MMM.YYYY', 'MMMM YYYY', 'MM-YYYY', 'YYYY-MM'];

    for (const format of formats) {
      const constraint = new DateTimeConstraint({format} as DateTimeConstraintConfig);
      expect(
        dataValuesMeetCondition(
          "2019-04-10'T'09:40:10.031Z",
          "2019-05-13'T'10:32:01.000Z",
          QueryCondition.Equals,
          constraint
        )
      ).toEqual(false);
      expect(
        dataValuesMeetCondition(
          "2019-04-10'T'09:40:10.031Z",
          "2019-04-10'T'10:32:01.000Z",
          QueryCondition.Equals,
          constraint
        )
      ).toEqual(true);
      expect(
        dataValuesMeetCondition(
          "2019-04-10'T'09:40:10.031Z",
          "2029-04-10'T'10:32:01.000Z",
          QueryCondition.Equals,
          constraint
        )
      ).toEqual(false);
      expect(
        dataValuesMeetCondition(
          "2019-04-10'T'09:40:10.031Z",
          "2019-04-13'T'10:32:01.000Z",
          QueryCondition.LowerThanEquals,
          constraint
        )
      ).toEqual(true);
      expect(
        dataValuesMeetCondition(
          "2019-04-10'T'09:40:10.031Z",
          "2019-04-13'T'10:32:01.000Z",
          QueryCondition.GreaterThanEquals,
          constraint
        )
      ).toEqual(true);
      expect(
        dataValuesMeetCondition(
          "2020-01-10'T'00:00:00.031Z",
          "2019-09-23'T'18:32:01.000Z",
          QueryCondition.GreaterThan,
          constraint
        )
      ).toEqual(true);
      expect(
        dataValuesMeetCondition(
          "2019-04-10'T'09:40:10.031Z",
          "2020-04-13'T'10:32:01.000Z",
          QueryCondition.LowerThan,
          constraint
        )
      ).toEqual(true);
    }
  });
});
