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
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Collection} from '../../../../../core/store/collections/collection';
import {Query} from '../../../../../core/store/navigation/query';
import {
  ChartAggregation,
  ChartAxisType,
  ChartConfig,
  ChartSortType,
  ChartType,
} from '../../../../../core/store/charts/chart';
import {ChartDataSet} from './chart-data';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {ChartDataConverter} from './chart-data-converter';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';

const documents: DocumentModel[] = [
  {
    collectionId: 'C1',
    id: 'D1',
    data: {a1: 'Sport', a2: 3, a3: 'Mama'},
  },
  {
    collectionId: 'C1',
    id: 'D2',
    data: {a1: 'Dance', a2: 7, a3: 'Salt'},
  },
  {
    collectionId: 'C1',
    id: 'D3',
    data: {a1: 'Glass', a2: 44},
  },
  {
    collectionId: 'C1',
    id: 'D4',
    data: {a1: 'Sport', a2: 0, a3: 'Dendo'},
  },
  {
    collectionId: 'C1',
    id: 'D5',
    data: {a1: 'Glass', a2: 7, a3: 'Vibes'},
  },
];

const collections: Collection[] = [
  {
    id: 'C1',
    name: 'collection',
    color: '#ffffff',
    attributes: [{id: 'a1', name: 'Lala'}, {id: 'a2', name: 'Kala'}, {id: 'a3', name: 'Sala'}],
  },
];

const permissions: Record<string, AllowedPermissions> = {C1: {writeWithView: true}};

const query: Query = {stems: [{collectionId: 'C1'}]};

describe('Chart data converter single collection', () => {
  it('should return empty data', () => {
    const config: ChartConfig = {type: ChartType.Line, axes: {}};
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query);
    expect(converter.convert(config)).toEqual({sets: [], type: ChartType.Line});
  });

  it('should return data by x', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {[ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0}},
    };
    const set: ChartDataSet = {
      id: 'C1',
      points: [
        {id: null, x: 'Sport', y: undefined},
        {id: null, x: 'Dance', y: undefined},
        {id: null, x: 'Glass', y: undefined},
      ],
      color: '#ffffff',
      isNumeric: false,
      draggable: false,
      name: undefined,
      yAxisType: ChartAxisType.Y1,
    };
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query);
    expect(converter.convert(config)).toEqual({sets: [set], type: ChartType.Line});
  });

  it('should return data by y', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {[ChartAxisType.Y1]: {collectionId: 'C1', attributeId: 'a2', collectionIndex: 0}},
    };
    const set: ChartDataSet = {
      id: 'C1',
      points: [
        {id: 'D1', x: undefined, y: 3},
        {id: 'D2', x: undefined, y: 7},
        {id: 'D3', x: undefined, y: 44},
        {id: 'D4', x: undefined, y: 0},
      ],
      color: '#ffffff',
      isNumeric: true,
      name: 'Kala',
      draggable: true,
      yAxisType: ChartAxisType.Y1,
    };
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query);
    expect(converter.convert(config)).toEqual({sets: [set], type: ChartType.Line});
  });

  it('should return data aggregated simple', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C1', attributeId: 'a2', collectionIndex: 0},
      },
      aggregations: {
        [ChartAxisType.Y1]: ChartAggregation.Sum,
      },
    };
    const set: ChartDataSet = {
      id: 'C1',
      points: [{id: null, x: 'Sport', y: 3}, {id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}],
      color: '#ffffff',
      isNumeric: true,
      name: 'Kala',
      draggable: true,
      yAxisType: ChartAxisType.Y1,
    };
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query);
    expect(converter.convert(config)).toEqual({sets: [set], type: ChartType.Line});

    const config2 = {
      ...config,
      aggregations: {
        [ChartAxisType.Y1]: ChartAggregation.Min,
      },
    };
    const set2 = {
      ...set,
      points: [{id: null, x: 'Sport', y: 0}, {id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 7}],
    };
    expect(converter.convert(config2)).toEqual({sets: [set2], type: ChartType.Line});

    const config3 = {...config, aggregations: null};
    const set3 = {
      ...set,
      points: [{id: null, x: 'Sport', y: 3}, {id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}],
    };
    expect(converter.convert(config3)).toEqual({sets: [set3], type: ChartType.Line});
  });

  it('should return data by Y1 and Y2', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C1', attributeId: 'a2', collectionIndex: 0},
        [ChartAxisType.Y2]: {collectionId: 'C1', attributeId: 'a3', collectionIndex: 0},
      },
      aggregations: {
        [ChartAxisType.Y1]: ChartAggregation.Sum,
      },
    };
    const points1 = [{id: null, x: 'Sport', y: 3}, {id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}];
    const points2 = [{id: 'D2', x: 'Dance', y: 'Salt'}, {id: 'D5', x: 'Glass', y: 'Vibes'}];

    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query);
    const chartData1 = converter.convert(config);
    expect(chartData1.sets.length).toEqual(2);
    expect(chartData1.sets[0].points).toEqual(points1);
    expect(chartData1.sets[1].points).toEqual(points2);

    const config2 = {...config, aggregations: null};
    const chartData2 = converter.convert(config2);
    const points3 = [{id: null, x: 'Sport', y: 3}, {id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}];
    const points4 = [{id: 'D2', x: 'Dance', y: 'Salt'}, {id: 'D5', x: 'Glass', y: 'Vibes'}];
    expect(chartData2.sets.length).toEqual(2);
    expect(chartData2.sets[0].points).toEqual(points3);
    expect(chartData2.sets[1].points).toEqual(points4);
  });
});

const documents2 = [
  ...documents,
  {
    collectionId: 'C1',
    id: 'D6',
    data: {a1: 'Lmr', a2: 90},
  },
  {
    collectionId: 'C2',
    id: 'D21',
    data: {a1: 'Min', a2: 8},
  },
  {
    collectionId: 'C2',
    id: 'D22',
    data: {a1: 'Max', a2: 333},
  },
  {
    collectionId: 'C2',
    id: 'D23',
    data: {a1: 'Avg', a2: 8},
  },
  {
    collectionId: 'C2',
    id: 'D24',
    data: {a1: 'Sum', a2: 54},
  },
  {
    collectionId: 'C2',
    id: 'D25',
    data: {a1: 'Dem', a2: 312},
  },
  {
    collectionId: 'C2',
    id: 'D26',
    data: {a1: 'Lep', a2: 1},
  },
  {
    collectionId: 'C3',
    id: 'D31',
    data: {a1: 'Abc', a2: 8},
  },
  {
    collectionId: 'C3',
    id: 'D32',
    data: {a1: 'Ant', a2: 333},
  },
  {
    collectionId: 'C3',
    id: 'D33',
    data: {a1: 'Ask', a2: 8},
  },
  {
    collectionId: 'C3',
    id: 'D34',
    data: {a1: 'Ara', a2: 54},
  },
  {
    collectionId: 'C3',
    id: 'D35',
    data: {a1: 'And', a2: 312},
  },
  {
    collectionId: 'C3',
    id: 'D36',
    data: {a1: 'As', a2: 1},
  },
  {
    collectionId: 'C4',
    id: 'D41',
    data: {a1: 'Zet', a2: 8},
  },
  {
    collectionId: 'C4',
    id: 'D42',
    data: {a1: 'Zem', a2: 333},
  },
  {
    collectionId: 'C4',
    id: 'D43',
    data: {a1: 'Zas', a2: 8},
  },
  {
    collectionId: 'C4',
    id: 'D44',
    data: {a1: 'Zoro', a2: 54},
  },
  {
    collectionId: 'C4',
    id: 'D45',
    data: {a1: 'Zlom', a2: 312},
  },
  {
    collectionId: 'C4',
    id: 'D46',
    data: {a1: 'Zino', a2: 1},
  },
];

const collections2 = [
  ...collections,
  {
    id: 'C2',
    name: 'collection2',
    color: '#bcbcbcb',
  },
  {
    id: 'C3',
    name: 'collection3',
    color: '#aabb44',
  },
  {
    id: 'C4',
    name: 'collection4',
    color: '#123456',
  },
];

const permissions2 = {
  ...permissions,
  C2: {writeWithView: true},
  C3: {writeWithView: true},
  C4: {writeWithView: true},
};

const linkTypes2: LinkType[] = [
  {
    id: 'LT1',
    name: 'LinkType1',
    collectionIds: ['C1', 'C2'],
  },
  {
    id: 'LT2',
    name: 'LinkType2',
    collectionIds: ['C2', 'C3'],
  },
  {
    id: 'LT3',
    name: 'LinkType3',
    collectionIds: ['C3', 'C4'],
  },
];

const linkInstances2: LinkInstance[] = [
  {
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D21'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D22'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D23'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D3', 'D24'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D3', 'D23'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D4', 'D26'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D4', 'D23'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D4', 'D22'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D5', 'D24'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D5', 'D22'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D6', 'D21'],
  },
  {
    linkTypeId: 'LT1',
    documentIds: ['D6', 'D26'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D21', 'D33'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D21', 'D32'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D22', 'D31'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D22', 'D35'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D34'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D36'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D24', 'D32'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D24', 'D33'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D25', 'D34'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D31'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D35'],
  },
  {
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D33'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D31', 'D42'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D31', 'D43'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D32', 'D45'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D33', 'D41'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D33', 'D46'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D43'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D44'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D45'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D35', 'D41'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D35', 'D46'],
  },
  {
    linkTypeId: 'LT3',
    documentIds: ['D36', 'D44'],
  },
];

const query2: Query = {stems: [{collectionId: 'C1', linkTypeIds: ['LT1', 'LT2', 'LT3']}]};

describe('Chart data converter linked collections', () => {
  it('should return empty data', () => {
    const config: ChartConfig = {type: ChartType.Line, axes: {}};
    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    expect(converter.convert(config)).toEqual({
      sets: [],
      type: ChartType.Line,
    });
  });

  it('should return linked data without linked name sum aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregations: {
        [ChartAxisType.Y1]: ChartAggregation.Sum,
      },
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Sport', y: 1808},
      {id: null, x: 'Dance', y: 428},
      {id: null, x: 'Glass', y: 1420},
      {id: null, x: 'Lmr', y: 680},
    ]);
  });

  it('should return linked data without linked name sum aggregation sorted desc', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      sort: {
        type: ChartSortType.Descending,
        axis: {
          collectionId: 'C1',
          attributeId: 'a2',
        },
      },
      aggregations: {[ChartAxisType.Y1]: ChartAggregation.Sum},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Lmr', y: 680},
      {id: null, x: 'Glass', y: 1420},
      {id: null, x: 'Dance', y: 428},
      {id: null, x: 'Sport', y: 1808},
    ]);
  });

  it('should return linked data without linked name sum aggregation non numeric', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a1', collectionIndex: 3},
      },
      aggregations: {[ChartAxisType.Y1]: ChartAggregation.Sum},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([]);
  });

  it('should return linked data without linked name min aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregations: {[ChartAxisType.Y1]: ChartAggregation.Min},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Sport', y: 1},
      {id: null, x: 'Dance', y: 8},
      {id: null, x: 'Glass', y: 1},
      {id: null, x: 'Lmr', y: 1},
    ]);
  });

  it('should return linked data without linked name max aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregations: {[ChartAxisType.Y1]: ChartAggregation.Max},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Sport', y: 333},
      {id: null, x: 'Dance', y: 312},
      {id: null, x: 'Glass', y: 333},
      {id: null, x: 'Lmr', y: 333},
    ]);
  });

  it('should return linked data without linked name avg aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregations: {[ChartAxisType.Y1]: ChartAggregation.Avg},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Sport', y: 1808 / 21},
      {id: null, x: 'Dance', y: 428 / 4},
      {id: null, x: 'Glass', y: 1420 / 14},
      {id: null, x: 'Lmr', y: 680 / 9},
    ]);
  });

  it('should return linked data with linked name', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C2', attributeId: 'a2', collectionIndex: 1},
      },
      names: {
        [ChartAxisType.Y1]: {collectionId: 'C3', attributeId: 'a1', collectionIndex: 2},
      },
      aggregations: {[ChartAxisType.Y1]: ChartAggregation.Sum},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(6);
    expect(chartData.sets.map(set => set.name)).toEqual(['Ask', 'Ant', 'Abc', 'And', 'Ara', 'As']);
    expect(chartData.sets[0].points).toContain({id: null, x: 'Sport', y: 126});
    expect(chartData.sets[1].points).toContain({id: null, x: 'Sport', y: 62});
    expect(chartData.sets[2].points).toContain({id: null, x: 'Sport', y: 1002});
    expect(chartData.sets[3].points).toContain({id: null, x: 'Sport', y: 1002});
    expect(chartData.sets[4].points).toContain({id: null, x: 'Sport', y: 320});
    expect(chartData.sets[5].points).toContain({id: 'D23', x: 'Sport', y: 8});
  });
});
