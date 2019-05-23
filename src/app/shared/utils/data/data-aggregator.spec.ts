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

import {DocumentModel} from '../../../core/store/documents/document.model';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {Query} from '../../../core/store/navigation/query';
import {DataAggregationAttribute, DataAggregator} from './data-aggregator';

const documents: DocumentModel[] = [
  {
    collectionId: 'C1',
    id: 'D1',
    data: {a1: 'Abc', a2: 2, a3: 2},
  },
  {
    collectionId: 'C1',
    id: 'D2',
    data: {a1: 'Ara', a2: 2, a3: 2},
  },
  {
    collectionId: 'C1',
    id: 'D3',
    data: {a1: 'Aka', a2: 2, a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D21',
    data: {a1: 'Bba', a2: 'Xxa', a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D22',
    data: {a1: 'Bbb', a2: 'Xxb', a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D23',
    data: {a1: 'Bbc', a2: 'Xxa', a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D24',
    data: {a1: 'Bbd', a2: 'Xxc', a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D25',
    data: {a1: 'Bbe', a2: 'Xxa', a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D26',
    data: {a1: 'Bbf', a2: 'Xxd', a3: 2},
  },
  {
    collectionId: 'C2',
    id: 'D27',
    data: {a1: 'Bbc', a2: 'Xxd', a3: 2},
  },
  {
    collectionId: 'C3',
    id: 'D31',
    data: {a1: 'Cca', a2: 'Yya', a3: 2},
  },
  {
    collectionId: 'C3',
    id: 'D32',
    data: {a1: 'Ccb', a2: 'Yyb', a3: 2},
  },
  {
    collectionId: 'C3',
    id: 'D33',
    data: {a1: 'Ccc', a2: 'Yya', a3: 2},
  },
  {
    collectionId: 'C3',
    id: 'D34',
    data: {a1: 'Ccd', a2: 'Yyb', a3: 2},
  },
  {
    collectionId: 'C3',
    id: 'D35',
    data: {a1: 'Cce', a2: 'Yyc', a3: 2},
  },
  {
    collectionId: 'C3',
    id: 'D36',
    data: {a1: 'Ccf', a2: 'Yya', a3: 2},
  },
];

const collections: Collection[] = [
  {
    id: 'C1',
    name: 'collection',
    color: '#ffffff',
    attributes: [{id: 'a1', name: 'Lala'}, {id: 'a2', name: 'Kala'}, {id: 'a3', name: 'Sala'}],
  },
  {
    id: 'C2',
    name: 'collection2',
    color: '#ffffff',
    attributes: [{id: 'a1', name: 'Lala'}, {id: 'a2', name: 'Kala'}, {id: 'a3', name: 'Sala'}],
  },
  {
    id: 'C3',
    name: 'collection3',
    color: '#ffffff',
    attributes: [{id: 'a1', name: 'Lala'}, {id: 'a2', name: 'Kala'}, {id: 'a3', name: 'Sala'}],
  },
];

const linkInstances: LinkInstance[] = [
  {
    id: 'l121',
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D21'],
    data: {a1: 'La', a2: 0},
  },
  {
    id: 'l122',
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D22'],
    data: {a1: 'Lb', a2: 0},
  },
  {
    id: 'l223',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D23'],
    data: {a1: 'Lc', a2: 0},
  },
  {
    id: 'l224',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D24'],
    data: {a1: 'Ld', a2: 0},
  },
  {
    id: 'l225',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D25'],
    data: {a1: 'Le', a2: 0},
  },
  {
    id: 'l326',
    linkTypeId: 'LT1',
    documentIds: ['D3', 'D26'],
    data: {a1: 'Lf', a2: 0},
  },
  {
    id: 'l2131',
    linkTypeId: 'LT2',
    documentIds: ['D21', 'D31'],
    data: {a1: 'Lg', a2: 0},
  },
  {
    id: 'l2332',
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D32'],
    data: {a1: 'Lh', a2: 0},
  },
  {
    id: 'l2333',
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D33'],
    data: {a1: 'Li', a2: 0},
  },
  {
    id: 'l2434',
    linkTypeId: 'LT2',
    documentIds: ['D24', 'D34'],
    data: {a1: 'Lj', a2: 0},
  },
  {
    id: 'l2635',
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D35'],
    data: {a1: 'Lk', a2: 0},
  },
  {
    id: 'l2636',
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D36'],
    data: {a1: 'Ll', a2: 0},
  },
];

const linkTypes: LinkType[] = [
  {
    id: 'LT1',
    name: 'LinkType1',
    collectionIds: ['C1', 'C2'],
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
  {
    id: 'LT2',
    name: 'LinkType2',
    collectionIds: ['C2', 'C3'],
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
];

const query: Query = {stems: [{collectionId: 'C1', linkTypeIds: ['LT1', 'LT2']}]};

describe('Data aggregator', () => {
  it('should return empty data', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);
    const aggregatedData = aggregator.aggregate([], [], []);
    expect(aggregatedData.map).toEqual({});
    expect(aggregatedData.rowLevels).toEqual(0);
    expect(aggregatedData.columnLevels).toEqual(0);
  });

  it('should return empty data by only values', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const valueAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a1', resourceIndex: 0},
      {attributeId: 'a2', resourceIndex: 1},
    ];
    const aggregatedData = aggregator.aggregate([], [], valueAttributes);
    expect(aggregatedData.map).toEqual({});
    expect(aggregatedData.rowLevels).toEqual(0);
    expect(aggregatedData.columnLevels).toEqual(0);
  });

  it('should aggregate by one row', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const aggregationAttributes: DataAggregationAttribute[] = [{attributeId: 'a1', resourceIndex: 0}];
    const aggregatedData = aggregator.aggregate(aggregationAttributes, [], []);
    expect(Object.keys(aggregatedData.map)).toEqual(['Abc', 'Ara', 'Aka']);

    const ids = Object.values(aggregatedData.map).reduce((arr, val) => [...arr, ...val[0].objects.map(v => v.id)], []);
    expect(ids).toEqual([]);
    expect(aggregatedData.rowLevels).toEqual(1);
    expect(aggregatedData.columnLevels).toEqual(0);
  });

  it('should aggregate by two rows', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const aggregationAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a1', resourceIndex: 0},
      {attributeId: 'a1', resourceIndex: 4},
    ];
    const aggregatedData = aggregator.aggregate(aggregationAttributes, [], []);
    expect(Object.keys(aggregatedData.map)).toEqual(['Abc', 'Ara', 'Aka']);

    expect(Object.keys(aggregatedData.map['Abc'])).toEqual(['Cca']);
    expect(Object.keys(aggregatedData.map['Ara'])).toEqual(['Ccb', 'Ccc', 'Ccd']);
    expect(Object.keys(aggregatedData.map['Aka'])).toEqual(['Cce', 'Ccf']);

    expect(aggregatedData.rowLevels).toEqual(2);
    expect(aggregatedData.columnLevels).toEqual(0);
  });

  it('should aggregate by one column', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const aggregationAttributes: DataAggregationAttribute[] = [{attributeId: 'a1', resourceIndex: 1}];
    const aggregatedData = aggregator.aggregate([], aggregationAttributes, []);
    expect(Object.keys(aggregatedData.map)).toEqual(['La', 'Lb', 'Lc', 'Ld', 'Le', 'Lf']);

    const ids = Object.values(aggregatedData.map).reduce((arr, val) => [...arr, ...val[0].objects.map(v => v.id)], []);
    expect(ids).toEqual([]);
    expect(aggregatedData.rowLevels).toEqual(0);
    expect(aggregatedData.columnLevels).toEqual(1);
  });

  it('should aggregate by two columns', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const aggregationAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a1', resourceIndex: 2},
      {attributeId: 'a2', resourceIndex: 2},
    ];
    const aggregatedData = aggregator.aggregate([], aggregationAttributes, []);
    expect(Object.keys(aggregatedData.map)).toEqual(['Bba', 'Bbb', 'Bbc', 'Bbd', 'Bbe', 'Bbf']);

    expect(Object.keys(aggregatedData.map['Bba'])).toEqual(['Xxa']);
    expect(Object.keys(aggregatedData.map['Bbb'])).toEqual(['Xxb']);
    expect(Object.keys(aggregatedData.map['Bbc'])).toEqual(['Xxa', 'Xxd']);
    expect(Object.keys(aggregatedData.map['Bbd'])).toEqual(['Xxc']);
    expect(Object.keys(aggregatedData.map['Bbe'])).toEqual(['Xxa']);
    expect(Object.keys(aggregatedData.map['Bbf'])).toEqual(['Xxd']);

    expect(aggregatedData.rowLevels).toEqual(0);
    expect(aggregatedData.columnLevels).toEqual(2);
  });

  it('should aggregate by two rows and two columns', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const rowAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a1', resourceIndex: 0},
      {attributeId: 'a1', resourceIndex: 2},
    ];
    const columnAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a2', resourceIndex: 4},
      {attributeId: 'a1', resourceIndex: 4},
    ];

    const aggregatedData = aggregator.aggregate(rowAttributes, columnAttributes, []);
    expect(Object.keys(aggregatedData.map)).toEqual(['Abc', 'Ara', 'Aka']);

    expect(Object.keys(aggregatedData.map['Abc'])).toEqual(['Bba', 'Bbb']);
    expect(Object.keys(aggregatedData.map['Ara'])).toEqual(['Bbc', 'Bbd', 'Bbe']);
    expect(Object.keys(aggregatedData.map['Aka'])).toEqual(['Bbf']);

    expect(Object.keys(aggregatedData.map['Abc']['Bba'])).toEqual(['Yya']);
    expect(Object.keys(aggregatedData.map['Abc']['Bbb'])).toEqual([]);
    expect(Object.keys(aggregatedData.map['Ara']['Bbc'])).toEqual(['Yyb', 'Yya']);
    expect(Object.keys(aggregatedData.map['Ara']['Bbd'])).toEqual(['Yyb']);
    expect(Object.keys(aggregatedData.map['Ara']['Bbe'])).toEqual([]);
    expect(Object.keys(aggregatedData.map['Aka']['Bbf'])).toEqual(['Yyc', 'Yya']);

    expect(Object.keys(aggregatedData.map['Abc']['Bba']['Yya'])).toEqual(['Cca']);
    expect(Object.keys(aggregatedData.map['Ara']['Bbc']['Yyb'])).toEqual(['Ccb']);
    expect(Object.keys(aggregatedData.map['Ara']['Bbc']['Yya'])).toEqual(['Ccc']);
    expect(Object.keys(aggregatedData.map['Ara']['Bbd']['Yyb'])).toEqual(['Ccd']);
    expect(Object.keys(aggregatedData.map['Aka']['Bbf']['Yyc'])).toEqual(['Cce']);
    expect(Object.keys(aggregatedData.map['Aka']['Bbf']['Yya'])).toEqual(['Ccf']);

    expect(aggregatedData.rowLevels).toEqual(2);
    expect(aggregatedData.columnLevels).toEqual(2);
  });

  it('should aggregate by one row and two values', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const rowAttributes: DataAggregationAttribute[] = [{attributeId: 'a1', resourceIndex: 0}];
    const valuesAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a1', resourceIndex: 2},
      {attributeId: 'a1', resourceIndex: 4},
    ];

    const aggregatedData = aggregator.aggregate(rowAttributes, [], valuesAttributes);
    expect(Object.keys(aggregatedData.map)).toEqual(['Abc', 'Ara', 'Aka']);

    expect(aggregatedData.map['Abc'][0].objects.map(v => v.id)).toEqual(['D21', 'D22']);
    expect(aggregatedData.map['Abc'][1].objects.map(v => v.id)).toEqual(['D31']);

    expect(aggregatedData.map['Ara'][0].objects.map(v => v.id)).toEqual(['D23', 'D24', 'D25']);
    expect(aggregatedData.map['Ara'][1].objects.map(v => v.id)).toEqual(['D32', 'D33', 'D34']);

    expect(aggregatedData.map['Aka'][0].objects.map(v => v.id)).toEqual(['D26']);
    expect(aggregatedData.map['Aka'][1].objects.map(v => v.id)).toEqual(['D35', 'D36']);

    expect(aggregatedData.rowLevels).toEqual(1);
    expect(aggregatedData.columnLevels).toEqual(0);
  });

  it('should aggregate by one row, one column and value', () => {
    const aggregator = new DataAggregator();
    aggregator.updateData(collections, documents, linkTypes, linkInstances, query);

    const rowAttributes: DataAggregationAttribute[] = [{attributeId: 'a1', resourceIndex: 0}];
    const columnAttributes: DataAggregationAttribute[] = [{attributeId: 'a1', resourceIndex: 2}];
    const valuesAttributes: DataAggregationAttribute[] = [
      {attributeId: 'a1', resourceIndex: 4},
      {attributeId: 'a1', resourceIndex: 4},
    ];

    const aggregatedData = aggregator.aggregate(rowAttributes, columnAttributes, valuesAttributes);

    expect(aggregatedData.map['Abc']['Bba'][0].objects.map(v => v.id)).toEqual(['D31']);
    expect(aggregatedData.map['Abc']['Bbb'][0].objects.map(v => v.id)).toEqual([]);

    expect(aggregatedData.map['Ara']['Bbc'][0].objects.map(v => v.id)).toEqual(['D32', 'D33']);
    expect(aggregatedData.map['Ara']['Bbd'][0].objects.map(v => v.id)).toEqual(['D34']);
    expect(aggregatedData.map['Ara']['Bbe'][0].objects.map(v => v.id)).toEqual([]);

    expect(aggregatedData.map['Aka']['Bbf'][0].objects.map(v => v.id)).toEqual(['D35', 'D36']);

    expect(aggregatedData.rowLevels).toEqual(1);
    expect(aggregatedData.columnLevels).toEqual(1);
  });
});
