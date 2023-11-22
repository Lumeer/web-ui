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
import {ConditionType} from '@lumeer/data-filters';

import {Collection} from '../../collections/collection';
import {Query} from './query';
import {addFiltersToQuery} from './query.converter';

const collection: Collection = {
  id: 'id1',
  name: 'test',
  attributes: [
    {id: 'a1', name: 'First Name'},
    {id: 'a2', name: 'Last Name'},
    {id: 'a3', name: 'Age'},
    {id: 'a4', name: 'ěščřž>'},
  ],
};

const emptyQuery: Query = {};
const query: Query = {
  stems: [{collectionId: 'id1'}],
};
const queryWithFilters: Query = {
  stems: [{collectionId: 'id1', filters: []}],
};

describe('parseStringFilters', () => {
  it('should parse simple filter', () => {
    expect(addFiltersToQuery(query, 'First Name=Pepa', collection)).toEqual({
      stems: [
        {
          collectionId: 'id1',
          filters: [
            {
              collectionId: 'id1',
              attributeId: 'a1',
              condition: ConditionType.Equals,
              conditionValues: [{value: 'Pepa'}],
            },
          ],
        },
      ],
    });
  });

  it('should not add anything to an empty query', () => {
    expect(addFiltersToQuery(emptyQuery, 'First Name=Pepa', collection)).toEqual({});
  });

  it('should parse double filter', () => {
    expect(addFiltersToQuery(query, 'First Name=Pepa; Last Name>=Zdepa', collection)).toEqual({
      stems: [
        {
          collectionId: 'id1',
          filters: [
            {
              collectionId: 'id1',
              attributeId: 'a1',
              condition: ConditionType.Equals,
              conditionValues: [{value: 'Pepa'}],
            },
            {
              collectionId: 'id1',
              attributeId: 'a2',
              condition: ConditionType.GreaterThanEquals,
              conditionValues: [{value: 'Zdepa'}],
            },
          ],
        },
      ],
    });
  });

  it('should parse filter that equals empty', () => {
    expect(addFiltersToQuery(queryWithFilters, 'First Name=', collection)).toEqual({
      stems: [
        {
          collectionId: 'id1',
          filters: [
            {collectionId: 'id1', attributeId: 'a1', condition: ConditionType.Equals, conditionValues: [{value: ''}]},
          ],
        },
      ],
    });
  });

  it('should parse double filter with empty value in the middle', () => {
    expect(addFiltersToQuery(query, 'First Name?; Last Name>=Zdepa', collection)).toEqual({
      stems: [
        {
          collectionId: 'id1',
          filters: [
            {collectionId: 'id1', attributeId: 'a1', condition: ConditionType.IsEmpty, conditionValues: [{value: ''}]},
            {
              collectionId: 'id1',
              attributeId: 'a2',
              condition: ConditionType.GreaterThanEquals,
              conditionValues: [{value: 'Zdepa'}],
            },
          ],
        },
      ],
    });
  });

  it('should parse attributes and values with special characters', () => {
    expect(addFiltersToQuery(query, 'ěščřž\\>>=\\=', collection)).toEqual({
      stems: [
        {
          collectionId: 'id1',
          filters: [
            {
              collectionId: 'id1',
              attributeId: 'a4',
              condition: ConditionType.GreaterThanEquals,
              conditionValues: [{value: '='}],
            },
          ],
        },
      ],
    });
  });
});
