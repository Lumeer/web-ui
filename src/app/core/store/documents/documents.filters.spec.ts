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

import {} from 'jasmine';
import {User} from '../users/user';
import {DocumentModel} from './document.model';
import {filterDocumentsByQuery} from './documents.filters';
import {Collection} from '../collections/collection';
import {Query} from '../navigation/query';
import {ConstraintType} from '../../model/data/constraint';

const documents: DocumentModel[] = [
  {
    collectionId: 'c1',
    id: 'd1',
    data: {
      a1: 'IBM',
      a2: 'Lala',
      a100: '40',
      a101: "2019-04-01'T'00:00:00.000Z",
    },
  },
  {
    collectionId: 'c1',
    id: 'd2',
    data: {
      a1: 'Red Hat',
      a2: 'aturing@lumeer.io',
      a100: '100',
      a101: "2019-04-02'T'00:00:00.000Z",
    },
    metaData: {
      parentId: 'd1',
    },
  },
  {
    collectionId: 'c1',
    id: 'd3',
    data: {
      a1: 'JBoss',
      a2: 'Lala',
      a100: '-10',
      a101: "2019-04-10'T'00:00:00.000Z",
    },
    metaData: {
      parentId: 'd2',
    },
  },
  {
    collectionId: 'c1',
    id: 'd4',
    data: {
      a1: 'SoftLayer',
      a2: 'Lala',
      a100: '55',
    },
    metaData: {
      parentId: 'd1',
    },
  },
  {
    collectionId: 'c1',
    id: 'd5',
    data: {
      a1: 'Microsoft',
      a2: 'Lala',
      a101: "2019-04-06'T'00:00:00.000Z",
    },
  },
  {
    collectionId: 'c1',
    id: 'd6',
    data: {
      a1: 'LinkedIn',
      a2: 'Lala',
      a100: '98',
      a101: "2019-04-11'T'00:00:00.000Z",
    },
    metaData: {
      parentId: 'd5',
    },
  },
  {
    collectionId: 'c2',
    id: 'd7',
    data: {
      a1: 'Red Hot Chili Peppers',
      a2: 'music@lumeer.io',
    },
  },
  {
    collectionId: 'c2',
    id: 'd8',
    data: {
      a1: 'Linkin Park',
      a2: 'music@lumeer.io',
    },
  },
];

const collections: Collection[] = [
  {
    id: 'c1',
    name: 'collection',
    attributes: [
      {id: 'a1', name: 'a1'},
      {id: 'a2', name: 'a2'},
      {id: 'a100', name: 'a100', constraint: {type: ConstraintType.Number, config: {}}},
      {id: 'a101', name: 'a101', constraint: {type: ConstraintType.DateTime, config: {}}},
    ],
  },
  {
    id: 'c2',
    name: 'collection',
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
];

const turingUser: User = {
  email: 'aturing@lumeer.io',
  groupsMap: {},
};

const musicUser: User = {
  email: 'music@lumeer.io',
  groupsMap: {},
};

describe('Document filters', () => {
  it('should filter empty documents by undefined query', () => {
    expect(filterDocumentsByQuery([], [], [], [], undefined, undefined)).toEqual([]);
  });

  it('should filter empty documents by empty query', () => {
    expect(filterDocumentsByQuery([], [], [], [], {}, undefined)).toEqual([]);
  });

  it('should not filter documents by empty query', () => {
    expect(filterDocumentsByQuery(documents, [], [], [], {}, undefined)).toEqual(documents);
  });

  it('should not filter documents by empty collections', () => {
    expect(filterDocumentsByQuery(documents, collections, [], [], {stems: []}, undefined)).toEqual(documents);
  });

  it('should not filter documents by all collections', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {stems: [{collectionId: 'c1'}, {collectionId: 'c2'}]},
        undefined
      )
    ).toEqual(documents);
  });

  it('should filter documents by single collection', () => {
    expect(
      filterDocumentsByQuery(documents, collections, [], [], {stems: [{collectionId: 'c1'}]}, undefined).length
    ).toBe(6);
  });

  it('should filter document by attribute value', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [{collectionId: 'c1', attributeId: 'a1', condition: '=', value: 'IBM'}],
            },
          ],
        },
        undefined
      ).map(document => document.id)
    ).toEqual(['d1']);
  });

  it('should filter by attribute value with userEmail() function and not existing user', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [{collectionId: 'c1', attributeId: 'a2', condition: '=', value: 'userEmail()'}],
            },
          ],
        },
        null
      ).map(document => document.id)
    ).toEqual([]);
  });

  it('should filter document by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [{collectionId: 'c1', attributeId: 'a2', condition: '=', value: 'userEmail()'}],
            },
          ],
        },
        turingUser
      ).map(document => document.id)
    ).toEqual(['d2']);
  });

  it('should not filter document by attribute value from other collection with userEmail() function', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c2',
              filters: [{collectionId: 'c2', attributeId: 'a2', condition: '=', value: 'userEmail()'}],
            },
          ],
        },
        turingUser
      ).map(document => document.id)
    ).toEqual([]);
  });

  it('should filter two documents by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c2',
              filters: [{collectionId: 'c2', attributeId: 'a2', condition: '=', value: 'userEmail()'}],
            },
          ],
        },
        musicUser
      ).map(document => document.id)
    ).toEqual(['d7', 'd8']);
  });

  it('should filter child documents by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [{collectionId: 'c1', attributeId: 'a2', condition: '=', value: 'userEmail()'}],
            },
          ],
        },
        turingUser,
        true
      ).map(document => document.id)
    ).toEqual(['d2', 'd3']);
  });

  it('should filter children together with parent document by attribute values', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [{collectionId: 'c1', attributeId: 'a1', condition: '=', value: 'IBM'}],
            },
          ],
        },
        undefined,
        true
      ).map(document => document.id)
    ).toEqual(['d1', 'd2', 'd3', 'd4']);
  });

  it('should filter children together with nested parent document by attribute values', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [{collectionId: 'c1', attributeId: 'a1', condition: '=', value: 'Red Hat'}],
            },
          ],
        },
        undefined,
        true
      ).map(document => document.id)
    ).toEqual(['d2', 'd3']);
  });

  it('should filter documents from both collections by fulltext', () => {
    expect(
      filterDocumentsByQuery(documents, collections, [], [], {fulltexts: ['link']}, undefined).map(
        document => document.id
      )
    ).toEqual(['d6', 'd8']);
  });

  it('should filter documents from single collection by collection and fulltext', () => {
    expect(
      filterDocumentsByQuery(
        documents,
        collections,
        [],
        [],
        {stems: [{collectionId: 'c1'}], fulltexts: ['link']},
        undefined
      ).map(document => document.id)
    ).toEqual(['d6']);
  });

  it('should filter children together with parent document by fulltext', () => {
    expect(
      filterDocumentsByQuery(documents, collections, [], [], {fulltexts: ['IBM']}, undefined, true).map(
        document => document.id
      )
    ).toEqual(['d1', 'd2', 'd3', 'd4']);
  });

  it('should filter only matching document without children by fulltext', () => {
    expect(
      filterDocumentsByQuery(documents, collections, [], [], {fulltexts: ['red']}, undefined).map(
        document => document.id
      )
    ).toEqual(['d2', 'd7']);
  });

  it('should filter children together with nested parent document by fulltext', () => {
    expect(
      filterDocumentsByQuery(documents, collections, [], [], {fulltexts: ['red']}, undefined, true).map(
        document => document.id
      )
    ).toEqual(['d2', 'd3', 'd7']);
  });

  it('should filter by number constraint', () => {
    let query: Query = {
      stems: [{collectionId: 'c1', filters: [{collectionId: 'c1', attributeId: 'a100', condition: '=', value: '-10'}]}],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d3']);

    query = {
      stems: [
        {collectionId: 'c1', filters: [{collectionId: 'c1', attributeId: 'a100', condition: '!=', value: '-10'}]},
      ],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d1', 'd2', 'd4', 'd5', 'd6']);

    query = {
      stems: [{collectionId: 'c1', filters: [{collectionId: 'c1', attributeId: 'a100', condition: '>', value: '40'}]}],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d2', 'd4', 'd6']);

    query = {
      stems: [{collectionId: 'c1', filters: [{collectionId: 'c1', attributeId: 'a100', condition: '<=', value: '40'}]}],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d1', 'd3']);
  });

  it('should filter by date constraint', () => {
    let query: Query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [{collectionId: 'c1', attributeId: 'a101', condition: '=', value: "2019-04-06'T'00:00:00.000Z"}],
        },
      ],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d5']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [{collectionId: 'c1', attributeId: 'a101', condition: '!=', value: "2019-04-06'T'00:00:00.000Z"}],
        },
      ],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d1', 'd2', 'd3', 'd4', 'd6']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [{collectionId: 'c1', attributeId: 'a101', condition: '<', value: "2019-04-06'T'00:00:00.000Z"}],
        },
      ],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d1', 'd2']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [{collectionId: 'c1', attributeId: 'a101', condition: '>=', value: "2019-04-06'T'00:00:00.000Z"}],
        },
      ],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual(['d3', 'd5', 'd6']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [{collectionId: 'c1', attributeId: 'a101', condition: '>=', value: 'bla bla bla'}],
        },
      ],
    };
    expect(
      filterDocumentsByQuery(documents, collections, [], [], query, undefined, false).map(document => document.id)
    ).toEqual([]);
  });
});
