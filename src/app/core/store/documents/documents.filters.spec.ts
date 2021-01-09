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

import {DateTimeConstraint} from '../../model/constraint/datetime.constraint';
import {NumberConstraint} from '../../model/constraint/number.constraint';
import {
  DateTimeConstraintConfig,
  NumberConstraintConfig,
  UserConstraintConfig,
} from '../../model/data/constraint-config';
import {LinkInstance} from '../link-instances/link.instance';
import {LinkType} from '../link-types/link.type';
import {User} from '../users/user';
import {DocumentModel} from './document.model';
import {filterDocumentsAndLinksByQuery} from './documents.filters';
import {Collection} from '../collections/collection';
import {Query} from '../navigation/query/query';
import {UserConstraintConditionValue} from '../../model/data/constraint-condition';
import {ConstraintData} from '../../model/data/constraint';
import {UserConstraint} from '../../model/constraint/user.constraint';
import {ConditionType} from '../../model/attribute-filter';
import {AttributesResource, AttributesResourceType, DataResource} from '../../model/resource';
import {objectsByIdMap} from '../../../shared/utils/common.utils';
import {convertDataResourceDataValues} from '../../../shared/utils/data-resource.utils';
import {UnknownConstraint} from '../../model/constraint/unknown.constraint';

const collections: Collection[] = [
  {
    id: 'c1',
    name: 'collection',
    attributes: [
      {id: 'a1', name: 'a1', constraint: new UnknownConstraint()},
      {id: 'a2', name: 'a2', constraint: new UserConstraint({} as UserConstraintConfig)},
      {id: 'a100', name: 'a100', constraint: new NumberConstraint({} as NumberConstraintConfig)},
      {id: 'a101', name: 'a101', constraint: new DateTimeConstraint({} as DateTimeConstraintConfig)},
    ],
  },
  {
    id: 'c2',
    name: 'collection',
    attributes: [
      {id: 'a1', name: 'a1', constraint: new UnknownConstraint()},
      {
        id: 'a2',
        name: 'a2',
        constraint: new UserConstraint({} as UserConstraintConfig),
      },
    ],
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

const constraintData: ConstraintData = {
  users: [turingUser, musicUser],
  currentUser: turingUser,
};

const documents: DocumentModel[] = convertDataResourcesDataValues(
  [
    {
      collectionId: 'c1',
      id: 'd1',
      data: {
        a1: 'IBM',
        a2: 'Lala',
        a100: '40',
        a101: '2019-04-01T00:00:00.000+0000',
      },
    },
    {
      collectionId: 'c1',
      id: 'd2',
      data: {
        a1: 'Red Hat',
        a2: 'aturing@lumeer.io',
        a100: '100',
        a101: '2019-04-02T00:00:00.000+0000',
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
        a101: '2019-04-10T00:00:00.000+0000',
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
        a101: '2019-04-06T00:00:00.000+0000',
      },
    },
    {
      collectionId: 'c1',
      id: 'd6',
      data: {
        a1: 'LinkedIn',
        a2: 'Lala',
        a100: '98',
        a101: '2019-04-11T00:00:00.000+0000',
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
  ],
  collections,
  constraintData
);

const linkTypes: LinkType[] = [
  {
    id: 'lt1',
    collectionIds: ['c1', 'c2'],
    attributes: [],
    name: 'link',
  },
];

const linkInstances: LinkInstance[] = convertDataResourcesDataValues(
  [
    {
      id: 'li1',
      linkTypeId: 'lt1',
      documentIds: ['d2', 'd7'],
      data: {},
    },
    {
      id: 'li2',
      linkTypeId: 'lt1',
      documentIds: ['d3', 'd8'],
      data: {},
    },
  ],
  linkTypes,
  constraintData
);

function convertDataResourcesDataValues<T extends DataResource>(
  dataResources: T[],
  attributesResources: AttributesResource[],
  constraintData: ConstraintData,
  type = AttributesResourceType.Collection
): T[] {
  const attributesResourcesMap = objectsByIdMap(attributesResources);
  return dataResources.map(dataResource => {
    const resource =
      type === AttributesResourceType.Collection
        ? attributesResourcesMap[(<any>dataResource).collectionId]
        : attributesResourcesMap[(<any>dataResource).linkTypeId];
    return {
      ...dataResource,
      dataValues: convertDataResourceDataValues(dataResource.data, resource?.attributes, constraintData),
    };
  });
}

describe('Document filters', () => {
  it('should filter empty documents by undefined query', () => {
    expect(filterDocumentsAndLinksByQuery([], [], [], [], undefined, {}, {}, undefined).documents).toEqual([]);
  });

  it('should filter empty documents by empty query', () => {
    expect(filterDocumentsAndLinksByQuery([], [], [], [], {}, {}, {}, undefined).documents).toEqual([]);
  });

  it('should not filter documents by empty query', () => {
    expect(filterDocumentsAndLinksByQuery(documents, [], [], [], {}, {}, {}, undefined).documents).toEqual(documents);
  });

  it('should not filter documents by empty collections', () => {
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], {stems: []}, {}, {}, undefined).documents
    ).toEqual(documents);
  });

  it('should not filter documents by all collections', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {stems: [{collectionId: 'c1'}, {collectionId: 'c2'}]},
        {},
        {},
        undefined
      ).documents
    ).toEqual(documents);
  });

  it('should filter documents by single collection', () => {
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], {stems: [{collectionId: 'c1'}]}, {}, {}, undefined)
        .documents.length
    ).toBe(6);
  });

  it('should filter document by attribute value', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a1',
                  condition: ConditionType.Equals,
                  conditionValues: [{value: 'IBM'}],
                },
              ],
            },
          ],
        },
        {},
        {}
      ).documents.map(document => document.id)
    ).toEqual(['d1']);
  });

  it('should filter by attribute value with userEmail() function and not existing user', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        convertDataResourcesDataValues(documents, collections, {...constraintData, currentUser: null}),
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a2',
                  condition: ConditionType.Equals,
                  conditionValues: [{type: UserConstraintConditionValue.CurrentUser}],
                },
              ],
            },
          ],
        },
        {},
        {}
      ).documents.map(document => document.id)
    ).toEqual([]);
  });

  it('should filter document by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a2',
                  condition: ConditionType.Equals,
                  conditionValues: [{type: UserConstraintConditionValue.CurrentUser}],
                },
              ],
            },
          ],
        },
        {},
        {}
      ).documents.map(document => document.id)
    ).toEqual(['d2']);
  });

  it('should not filter document by attribute value from other collection with userEmail() function', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c2',
              filters: [
                {
                  collectionId: 'c2',
                  attributeId: 'a2',
                  condition: ConditionType.Equals,
                  conditionValues: [{type: UserConstraintConditionValue.CurrentUser}],
                },
              ],
            },
          ],
        },
        {},
        {}
      ).documents.map(document => document.id)
    ).toEqual([]);
  });

  it('should filter two documents by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        convertDataResourcesDataValues(documents, collections, {...constraintData, currentUser: musicUser}),
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c2',
              filters: [
                {
                  collectionId: 'c2',
                  attributeId: 'a2',
                  condition: ConditionType.Equals,
                  conditionValues: [{type: UserConstraintConditionValue.CurrentUser}],
                },
              ],
            },
          ],
        },
        {},
        {}
      ).documents.map(document => document.id)
    ).toEqual(['d7', 'd8']);
  });

  it('should filter child documents by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a2',
                  condition: ConditionType.Equals,
                  conditionValues: [{type: UserConstraintConditionValue.CurrentUser}],
                },
              ],
            },
          ],
        },
        {},
        {},
        true
      ).documents.map(document => document.id)
    ).toEqual(['d2', 'd3']);
  });

  it('should filter two linked documents by attribute value with userEmail() function', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        linkTypes,
        linkInstances,
        {
          stems: [
            {
              collectionId: 'c1',
              linkTypeIds: ['lt1'],
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a2',
                  condition: ConditionType.Equals,
                  conditionValues: [{type: UserConstraintConditionValue.CurrentUser}],
                },
              ],
            },
          ],
        },
        {},
        {},
        true
      ).documents.map(document => document.id)
    ).toEqual(['d7', 'd2', 'd8', 'd3']);
  });

  it('should filter children together with parent document by attribute values', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a1',
                  condition: ConditionType.Equals,
                  conditionValues: [{value: 'IBM'}],
                },
              ],
            },
          ],
        },
        {},
        {},
        true
      ).documents.map(document => document.id)
    ).toEqual(['d1', 'd2', 'd3', 'd4']);
  });

  it('should filter children together with nested parent document by attribute values', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {
          stems: [
            {
              collectionId: 'c1',
              filters: [
                {
                  collectionId: 'c1',
                  attributeId: 'a1',
                  condition: ConditionType.Equals,
                  conditionValues: [{value: 'Red Hat'}],
                },
              ],
            },
          ],
        },
        {},
        {},
        true
      ).documents.map(document => document.id)
    ).toEqual(['d2', 'd3']);
  });

  it('should filter documents from both collections by fulltext', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {fulltexts: ['link']},
        {},
        {},
        undefined
      ).documents.map(document => document.id)
    ).toEqual(['d6', 'd8']);
  });

  it('should filter documents from single collection by collection and fulltext', () => {
    expect(
      filterDocumentsAndLinksByQuery(
        documents,
        collections,
        [],
        [],
        {stems: [{collectionId: 'c1'}], fulltexts: ['link']},
        {},
        {},
        undefined
      ).documents.map(document => document.id)
    ).toEqual(['d6']);
  });

  it('should filter children together with parent document by fulltext', () => {
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], {fulltexts: ['IBM']}, {}, {}, true).documents.map(
        document => document.id
      )
    ).toEqual(['d1', 'd2', 'd3', 'd4']);
  });

  it('should filter only matching document without children by fulltext', () => {
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], {fulltexts: ['red']}, {}, {}).documents.map(
        document => document.id
      )
    ).toEqual(['d2', 'd7']);
  });

  it('should filter children together with nested parent document by fulltext', () => {
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], {fulltexts: ['red']}, {}, {}, true).documents.map(
        document => document.id
      )
    ).toEqual(['d2', 'd3', 'd7']);
  });

  it('should filter by number constraint', () => {
    let query: Query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a100',
              condition: ConditionType.Equals,
              conditionValues: [{value: '-10'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d3']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a100',
              condition: ConditionType.NotEquals,
              conditionValues: [{value: '-10'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d1', 'd2', 'd4', 'd5', 'd6']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a100',
              condition: ConditionType.GreaterThan,
              conditionValues: [{value: '40'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d2', 'd4', 'd6']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a100',
              condition: ConditionType.LowerThanEquals,
              conditionValues: [{value: '40'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d1', 'd3']);
  });

  it('should filter by date constraint', () => {
    let query: Query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a101',
              condition: ConditionType.Equals,
              conditionValues: [{value: '2019-04-06T00:00:00.000+0000'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d5']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a101',
              condition: ConditionType.NotEquals,
              conditionValues: [{value: '2019-04-06T00:00:00.000+0000'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d1', 'd2', 'd3', 'd4', 'd6']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a101',
              condition: ConditionType.LowerThan,
              conditionValues: [{value: '2019-04-06T00:00:00.000+0000'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d1', 'd2']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a101',
              condition: ConditionType.GreaterThanEquals,
              conditionValues: [{value: '2019-04-06T00:00:00.000+0000'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual(['d3', 'd5', 'd6']);

    query = {
      stems: [
        {
          collectionId: 'c1',
          filters: [
            {
              collectionId: 'c1',
              attributeId: 'a101',
              condition: ConditionType.GreaterThanEquals,
              conditionValues: [{value: 'bla bla bla'}],
            },
          ],
        },
      ],
    };
    expect(
      filterDocumentsAndLinksByQuery(documents, collections, [], [], query, {}, {}, false).documents.map(
        document => document.id
      )
    ).toEqual([]);
  });
});
