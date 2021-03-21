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

import {LOCALE_ID, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query/query';
import {PivotDataConverter} from './pivot-data-converter';
import {PivotConfig} from '../../../../core/store/pivots/pivot';
import {AttributesResourceType} from '../../../../core/model/resource';
import {DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {UnknownConstraint} from '@lumeer/data-filters';

const documents: DocumentModel[] = [
  {collectionId: 'C1', id: 'D1', data: {a1: 'abc'}},
  {collectionId: 'C1', id: 'D2', data: {a1: 'abc'}},
  {collectionId: 'C1', id: 'D3', data: {a1: 'def'}},

  {collectionId: 'C2', id: 'D21', data: {a1: 'a'}},
  {collectionId: 'C2', id: 'D22', data: {a1: 'c'}},
  {collectionId: 'C2', id: 'D23', data: {a1: 'a'}},
  {collectionId: 'C2', id: 'D24', data: {a1: 'b'}},
  {collectionId: 'C2', id: 'D25', data: {a1: 'b'}},
  {collectionId: 'C2', id: 'D26', data: {a1: 'c'}},

  {collectionId: 'C3', id: 'D31', data: {a1: 'xyz'}},
  {collectionId: 'C3', id: 'D32', data: {a1: 'xyz'}},
  {collectionId: 'C3', id: 'D33', data: {a1: 'vuw'}},
  {collectionId: 'C3', id: 'D34', data: {a1: 'vuw'}},
  {collectionId: 'C3', id: 'D35', data: {a1: 'vuw'}},
  {collectionId: 'C3', id: 'D35', data: {a1: 'vuw'}},
  {collectionId: 'C3', id: 'D36', data: {a1: 'xyz'}},

  {collectionId: 'C4', id: 'D41', data: {a1: 2, a2: 3}},
  {collectionId: 'C4', id: 'D42', data: {a1: 4, a2: 0}},
  {collectionId: 'C4', id: 'D43', data: {a1: 6, a2: -10}},
  {collectionId: 'C4', id: 'D44', data: {a1: 1, a2: 3}},
  {collectionId: 'C4', id: 'D45', data: {a1: null, a2: 1}},
  {collectionId: 'C4', id: 'D46', data: {a1: 2, a2: null}},
  {collectionId: 'C4', id: 'D47', data: {}},
  {collectionId: 'C4', id: 'D48', data: {a1: 20, a2: 7}},
  {collectionId: 'C4', id: 'D49', data: {a1: 11, a2: 9}},
];

const collections: Collection[] = [
  {
    id: 'C1',
    name: 'collection',
    attributes: [{id: 'a1', name: 'Aaa'}],
  },
  {
    id: 'C2',
    name: 'collection2',
    attributes: [{id: 'a1', name: 'Bbb'}],
  },
  {
    id: 'C3',
    name: 'collection3',
    attributes: [{id: 'a1', name: 'Ccc'}],
  },
  {
    id: 'C4',
    name: 'collection4',
    attributes: [
      {id: 'a1', name: 'Ddd'},
      {id: 'a2', name: 'Eee'},
    ],
  },
];

const linkInstances: LinkInstance[] = [
  {
    id: 'l121',
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D21'],
    data: {},
  },
  {
    id: 'l122',
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D22'],
    data: {},
  },
  {
    id: 'l123',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D23'],
    data: {},
  },
  {
    id: 'l124',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D24'],
    data: {},
  },
  {
    id: 'l125',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D25'],
    data: {},
  },
  {
    id: 'l126',
    linkTypeId: 'LT1',
    documentIds: ['D3', 'D26'],
    data: {},
  },
  {
    id: 'l2131',
    linkTypeId: 'LT2',
    documentIds: ['D21', 'D31'],
    data: {},
  },
  {
    id: 'l2232',
    linkTypeId: 'LT2',
    documentIds: ['D22', 'D32'],
    data: {},
  },
  {
    id: 'l2233',
    linkTypeId: 'LT2',
    documentIds: ['D22', 'D33'],
    data: {},
  },
  {
    id: 'l2334',
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D34'],
    data: {},
  },
  {
    id: 'l2434',
    linkTypeId: 'LT2',
    documentIds: ['D24', 'D34'],
    data: {},
  },
  {
    id: 'l2534',
    linkTypeId: 'LT2',
    documentIds: ['D25', 'D34'],
    data: {},
  },
  {
    id: 'l2535',
    linkTypeId: 'LT2',
    documentIds: ['D25', 'D35'],
    data: {},
  },
  {
    id: 'l2636',
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D36'],
    data: {},
  },
  {
    id: 'l3141',
    linkTypeId: 'LT3',
    documentIds: ['D31', 'D41'],
    data: {},
  },
  {
    id: 'l3241',
    linkTypeId: 'LT3',
    documentIds: ['D32', 'D41'],
    data: {},
  },
  {
    id: 'l3242',
    linkTypeId: 'LT3',
    documentIds: ['D32', 'D42'],
    data: {},
  },
  {
    id: 'l3342',
    linkTypeId: 'LT3',
    documentIds: ['D33', 'D43'],
    data: {},
  },
  {
    id: 'l3443',
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D43'],
    data: {},
  },
  {
    id: 'l3444',
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D44'],
    data: {},
  },
  {
    id: 'l3545',
    linkTypeId: 'LT3',
    documentIds: ['D35', 'D45'],
    data: {},
  },
  {
    id: 'l3546',
    linkTypeId: 'LT3',
    documentIds: ['D35', 'D46'],
    data: {},
  },
  {
    id: 'l3647',
    linkTypeId: 'LT3',
    documentIds: ['D36', 'D47'],
    data: {},
  },
  {
    id: 'l3648',
    linkTypeId: 'LT3',
    documentIds: ['D36', 'D48'],
    data: {},
  },
  {
    id: 'l3649',
    linkTypeId: 'LT3',
    documentIds: ['D36', 'D49'],
    data: {},
  },
];

const linkTypes: LinkType[] = [
  {
    id: 'LT1',
    name: 'LinkType1',
    collectionIds: ['C1', 'C2'],
    attributes: [],
  },
  {
    id: 'LT2',
    name: 'LinkType2',
    collectionIds: ['C2', 'C3'],
    attributes: [],
  },
  {
    id: 'LT3',
    name: 'LinkType3',
    collectionIds: ['C3', 'C4'],
    attributes: [],
  },
];

const query: Query = {stems: [{collectionId: 'C1', linkTypeIds: ['LT1', 'LT2', 'LT3']}]};

describe('Pivot data converter', () => {
  let constraintReadableFormatter: SelectItemWithConstraintFormatter;
  let dataConverter: PivotDataConverter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LOCALE_ID,
          useFactory: () => 'en',
        },
        {
          provide: TRANSLATIONS,
          useFactory: () => require(`raw-loader!../../../../../../src/i18n/messages.en.xlf`).default,
          deps: [LOCALE_ID],
        },
        {
          provide: TRANSLATIONS_FORMAT,
          useFactory: () => 'xlf',
        },
      ],
    });
    constraintReadableFormatter = TestBed.inject(SelectItemWithConstraintFormatter);
    dataConverter = new PivotDataConverter(constraintReadableFormatter, type => type.toString());
  });

  it('should return empty data', () => {
    const config: PivotConfig = {stemsConfigs: [{rowAttributes: [], columnAttributes: [], valueAttributes: []}]};
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data).toEqual([]);
  });

  it('should return by one row', () => {
    const config: PivotConfig = {
      stemsConfigs: [
        {
          rowAttributes: [
            {resourceId: 'C2', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 2},
          ],
          columnAttributes: [],
          valueAttributes: [],
        },
      ],
    };
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data[0].rowHeaders).toEqual([
      {
        title: 'a',
        targetIndex: 0,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[1].attributes[0].name,
      },
      {
        title: 'c',
        targetIndex: 1,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[1].attributes[0].name,
      },
      {
        title: 'b',
        targetIndex: 2,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[1].attributes[0].name,
      },
    ]);
    expect(pivotData.data[0].columnHeaders).toEqual([]);
    expect(pivotData.data[0].values).toEqual([[undefined], [undefined], [undefined]]);
  });

  it('should return by one column', () => {
    const config: PivotConfig = {
      stemsConfigs: [
        {
          rowAttributes: [],
          columnAttributes: [
            {resourceId: 'C3', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 4},
          ],
          valueAttributes: [],
        },
      ],
    };
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data[0].rowHeaders).toEqual([]);
    expect(pivotData.data[0].columnHeaders).toEqual([
      {
        title: 'xyz',
        targetIndex: 0,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[2].attributes[0].name,
      },
      {
        title: 'vuw',
        targetIndex: 1,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[2].attributes[0].name,
      },
    ]);
    expect(pivotData.data[0].values).toEqual([[undefined, undefined]]);
  });

  it('should return by two values', () => {
    const config: PivotConfig = {
      stemsConfigs: [
        {
          rowAttributes: [],
          columnAttributes: [],
          valueAttributes: [
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a1',
              resourceIndex: 6,
              aggregation: DataAggregationType.Sum,
            },
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a2',
              resourceIndex: 6,
              aggregation: DataAggregationType.Min,
            },
          ],
        },
      ],
    };
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data[0].rowHeaders).toEqual([]);
    expect(pivotData.data[0].columnHeaders).toEqual([
      {
        title: dataConverter.createValueTitle(DataAggregationType.Sum, 'Ddd'),
        targetIndex: 0,
        color: undefined,
        isValueHeader: true,
      },
      {
        title: dataConverter.createValueTitle(DataAggregationType.Min, 'Eee'),
        targetIndex: 1,
        color: undefined,
        isValueHeader: true,
      },
    ]);
    expect(pivotData.data[0].values).toEqual([[46, -10]]);
  });

  it('should return by row and value', () => {
    const config: PivotConfig = {
      stemsConfigs: [
        {
          rowAttributes: [
            {resourceId: 'C1', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 0},
          ],
          columnAttributes: [],
          valueAttributes: [
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a1',
              resourceIndex: 6,
              aggregation: DataAggregationType.Sum,
            },
          ],
        },
      ],
    };
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data[0].rowHeaders).toEqual([
      {
        title: 'abc',
        targetIndex: 0,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
      {
        title: 'def',
        targetIndex: 1,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
    ]);
    expect(pivotData.data[0].columnHeaders).toEqual([
      {
        title: dataConverter.createValueTitle(DataAggregationType.Sum, 'Ddd'),
        targetIndex: 0,
        color: undefined,
        isValueHeader: true,
      },
    ]);
    expect(pivotData.data[0].values).toEqual([[37], [31]]);
  });

  it('should return by column and value', () => {
    const config: PivotConfig = {
      stemsConfigs: [
        {
          rowAttributes: [],
          columnAttributes: [
            {resourceId: 'C1', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 2},
          ],
          valueAttributes: [
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a2',
              resourceIndex: 6,
              aggregation: DataAggregationType.Sum,
            },
          ],
        },
      ],
    };
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data[0].rowHeaders).toEqual([]);
    expect(pivotData.data[0].columnHeaders).toEqual([
      {
        title: 'a',
        targetIndex: 0,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
      {
        title: 'c',
        targetIndex: 1,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
      {
        title: 'b',
        targetIndex: 2,
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
    ]);
    expect(pivotData.data[0].values).toEqual([[-4, 9, -13]]);
  });

  it('should return by two rows, column and three values', () => {
    const config: PivotConfig = {
      stemsConfigs: [
        {
          rowAttributes: [
            {resourceId: 'C1', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 0},
            {resourceId: 'C2', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 2},
          ],
          columnAttributes: [
            {resourceId: 'C3', resourceType: AttributesResourceType.Collection, attributeId: 'a1', resourceIndex: 4},
          ],
          valueAttributes: [
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a1',
              resourceIndex: 6,
              aggregation: DataAggregationType.Sum,
            },
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a1',
              resourceIndex: 6,
              aggregation: DataAggregationType.Max,
            },
            {
              resourceId: 'C4',
              resourceType: AttributesResourceType.Collection,
              attributeId: 'a2',
              resourceIndex: 6,
              aggregation: DataAggregationType.Count,
            },
          ],
        },
      ],
    };
    const pivotData = dataConverter.transform(config, collections, documents, linkTypes, linkInstances, query);
    expect(pivotData.data[0].rowHeaders).toEqual([
      {
        title: 'abc',
        children: [
          {
            title: 'a',
            targetIndex: 0,
            color: undefined,
            constraint: new UnknownConstraint(),
            isValueHeader: false,
            attributeName: collections[1].attributes[0].name,
          },
          {
            title: 'c',
            targetIndex: 1,
            color: undefined,
            constraint: new UnknownConstraint(),
            isValueHeader: false,
            attributeName: collections[1].attributes[0].name,
          },
          {
            title: 'b',
            targetIndex: 2,
            color: undefined,
            constraint: new UnknownConstraint(),
            isValueHeader: false,
            attributeName: collections[1].attributes[0].name,
          },
        ],
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
      {
        title: 'def',
        children: [
          {
            title: 'c',
            targetIndex: 3,
            color: undefined,
            constraint: new UnknownConstraint(),
            isValueHeader: false,
            attributeName: collections[1].attributes[0].name,
          },
        ],
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[0].attributes[0].name,
      },
    ]);
    const valueTitles = [
      dataConverter.createValueTitle(DataAggregationType.Sum, 'Ddd'),
      dataConverter.createValueTitle(DataAggregationType.Max, 'Ddd'),
      dataConverter.createValueTitle(DataAggregationType.Count, 'Eee'),
    ];
    expect(pivotData.data[0].columnHeaders).toEqual([
      {
        title: 'xyz',
        children: [
          {title: valueTitles[0], targetIndex: 0, color: undefined, isValueHeader: true},
          {title: valueTitles[1], targetIndex: 1, color: undefined, isValueHeader: true},
          {title: valueTitles[2], targetIndex: 2, color: undefined, isValueHeader: true},
        ],
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[2].attributes[0].name,
      },
      {
        title: 'vuw',
        children: [
          {title: valueTitles[0], targetIndex: 3, color: undefined, isValueHeader: true},
          {title: valueTitles[1], targetIndex: 4, color: undefined, isValueHeader: true},
          {title: valueTitles[2], targetIndex: 5, color: undefined, isValueHeader: true},
        ],
        color: undefined,
        constraint: new UnknownConstraint(),
        isValueHeader: false,
        attributeName: collections[2].attributes[0].name,
      },
    ]);
    expect(pivotData.data[0].values).toEqual([
      [2, 2, 1, 7, 6, 2],
      [6, 4, 2, 6, 6, 1],
      [null, null, null, 16, 6, 5],
      [31, 20, 2, null, null, null],
    ]);
    expect(pivotData.data[0].valueTitles).toEqual(valueTitles);
  });
});
