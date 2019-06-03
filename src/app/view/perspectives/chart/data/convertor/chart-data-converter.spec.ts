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

import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {Collection} from '../../../../../core/store/collections/collection';
import {Query} from '../../../../../core/store/navigation/query';
import {ChartAxisType, ChartConfig, ChartSortType, ChartType} from '../../../../../core/store/charts/chart';
import {ChartAxisCategory, ChartDataSet} from './chart-data';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {ChartDataConverter} from './chart-data-converter';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {ConstraintType} from '../../../../../core/model/data/constraint';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {DataAggregationType} from '../../../../../shared/utils/data/data-aggregation';

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
    converter.updateData(collections, documents, permissions, query, config);
    expect(converter.convert(config)).toEqual({
      sets: [
        {
          yAxisType: ChartAxisType.Y1,
          yAxis: {
            category: ChartAxisCategory.Number,
          },
          name: '',
          draggable: false,
          points: [],
          id: null,
          resourceType: AttributesResourceType.Collection,
          color: '#ffffff',
        },
      ],
      type: ChartType.Line,
    });
  });

  it('should return data by x', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
      },
    };
    const set: ChartDataSet = {
      id: null,
      points: [
        {id: null, x: 'Dance', y: undefined},
        {id: null, x: 'Glass', y: undefined},
        {id: null, x: 'Sport', y: undefined},
      ],
      color: '#ffffff',
      xAxis: {
        category: ChartAxisCategory.Text,
        config: undefined,
      },
      yAxis: undefined,
      draggable: false,
      name: undefined,
      yAxisType: ChartAxisType.Y1,
      resourceType: AttributesResourceType.Collection,
    };
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query, config);
    expect(converter.convert(config)).toEqual({sets: [set], type: ChartType.Line});
  });

  it('should return data by y', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.Y1]: {
          resourceId: 'C1',
          attributeId: 'a2',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
      },
    };
    const set: ChartDataSet = {
      id: 'a2',
      points: [
        {id: 'D1', x: undefined, y: 3},
        {id: 'D2', x: undefined, y: 7},
        {id: 'D3', x: undefined, y: 44},
        {id: 'D4', x: undefined, y: 0},
      ],
      color: '#ffffff',
      yAxis: {
        category: ChartAxisCategory.Number,
        config: undefined,
      },
      xAxis: undefined,
      name: 'Kala',
      draggable: true,
      yAxisType: ChartAxisType.Y1,
      resourceType: AttributesResourceType.Collection,
    };
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query, config);
    expect(converter.convert(config)).toEqual({sets: [set], type: ChartType.Line});
  });

  it('should return data aggregated simple', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C1',
          attributeId: 'a2',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {
        [ChartAxisType.Y1]: DataAggregationType.Sum,
      },
    };
    const set: ChartDataSet = {
      id: 'a2',
      points: [{id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}, {id: null, x: 'Sport', y: 3}],
      color: 'rgba(255,255,255,1)',
      yAxis: {
        category: ChartAxisCategory.Number,
        config: undefined,
      },
      xAxis: {
        category: ChartAxisCategory.Text,
        config: undefined,
      },
      name: 'Kala',
      draggable: true,
      yAxisType: ChartAxisType.Y1,
      resourceType: AttributesResourceType.Collection,
    };
    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query, config);
    expect(converter.convert(config)).toEqual({sets: [set], type: ChartType.Line});

    const config2 = {
      ...config,
      aggregations: {
        [ChartAxisType.Y1]: DataAggregationType.Min,
      },
    };
    const set2 = {
      ...set,
      points: [{id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 7}, {id: null, x: 'Sport', y: 0}],
    };
    expect(converter.convert(config2)).toEqual({sets: [set2], type: ChartType.Line});

    const config3 = {...config, aggregations: null};
    const set3 = {
      ...set,
      points: [{id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}, {id: null, x: 'Sport', y: 3}],
    };
    expect(converter.convert(config3)).toEqual({sets: [set3], type: ChartType.Line});
  });

  it('should return data by Y1 and Y2', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C1',
          attributeId: 'a2',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y2]: {
          resourceId: 'C1',
          attributeId: 'a3',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {
        [ChartAxisType.Y1]: DataAggregationType.Sum,
      },
    };
    const points1 = [{id: 'D2', x: 'Dance', y: 7}, {id: null, x: 'Glass', y: 51}, {id: null, x: 'Sport', y: 3}];
    const points2 = [
      {id: 'D2', x: 'Dance', y: 'Salt'},
      {id: 'D5', x: 'Glass', y: 'Vibes'},
      {id: null, x: 'Sport', y: 'Mama'},
    ];

    const converter = new ChartDataConverter();
    converter.updateData(collections, documents, permissions, query, config);
    const chartData1 = converter.convert(config);
    expect(chartData1.sets.length).toEqual(2);
    expect(chartData1.sets[0].points).toEqual(points1);
    expect(chartData1.sets[1].points).toEqual(points2);

    const config2 = {...config, aggregations: null};
    const chartData2 = converter.convert(config2);
    expect(chartData2.sets.length).toEqual(2);
    expect(chartData2.sets[0].points).toEqual(points1);
    expect(chartData2.sets[1].points).toEqual(points2);
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
    color: '#bcbcbc',
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}, {id: 'a3', name: 'a3'}],
  },
  {
    id: 'C3',
    name: 'collection3',
    color: '#aabb44',
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}, {id: 'a3', name: 'a3'}],
  },
  {
    id: 'C4',
    name: 'collection4',
    color: '#123456',
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}, {id: 'a3', name: 'a3'}],
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
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
  {
    id: 'LT2',
    name: 'LinkType2',
    collectionIds: ['C2', 'C3'],
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
  {
    id: 'LT3',
    name: 'LinkType3',
    collectionIds: ['C3', 'C4'],
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
];

const linkInstances2: LinkInstance[] = [
  {
    id: 'l1',
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D21'],
    data: {a1: 'Lmx', a2: 30},
  },
  {
    id: 'l2',
    linkTypeId: 'LT1',
    documentIds: ['D1', 'D22'],
    data: {a1: 'Lmp', a2: 20},
  },
  {
    id: 'l3',
    linkTypeId: 'LT1',
    documentIds: ['D2', 'D23'],
    data: {a1: 'Lpr', a2: 80},
  },
  {
    id: 'l4',
    linkTypeId: 'LT1',
    documentIds: ['D3', 'D24'],
    data: {a1: 'Lxx', a2: 10},
  },
  {
    id: 'l5',
    linkTypeId: 'LT1',
    documentIds: ['D3', 'D23'],
    data: {a1: 'Lll', a2: 30},
  },
  {
    id: 'l6',
    linkTypeId: 'LT1',
    documentIds: ['D4', 'D26'],
    data: {a1: 'Lop', a2: 100},
  },
  {
    id: 'l7',
    linkTypeId: 'LT1',
    documentIds: ['D4', 'D23'],
    data: {a1: 'Los', a2: 310},
  },
  {
    id: 'l8',
    linkTypeId: 'LT1',
    documentIds: ['D4', 'D22'],
    data: {a1: 'Lqq', a2: 70},
  },
  {
    id: 'l9',
    linkTypeId: 'LT1',
    documentIds: ['D5', 'D24'],
    data: {a1: 'Lss', a2: 90},
  },
  {
    id: 'l10',
    linkTypeId: 'LT1',
    documentIds: ['D5', 'D22'],
    data: {a1: 'Ldd', a2: 304},
  },
  {
    id: 'l11',
    linkTypeId: 'LT1',
    documentIds: ['D6', 'D21'],
    data: {a1: 'Lee', a2: 330},
  },
  {
    id: 'l12',
    linkTypeId: 'LT1',
    documentIds: ['D6', 'D26'],
    data: {a1: 'Loo', a2: 3},
  },
  {
    id: 'l13',
    linkTypeId: 'LT2',
    documentIds: ['D21', 'D33'],
    data: {a1: 'Lzz', a2: 430},
  },
  {
    id: 'l14',
    linkTypeId: 'LT2',
    documentIds: ['D21', 'D32'],
    data: {a1: 'Ltt', a2: 220},
  },
  {
    id: 'l15',
    linkTypeId: 'LT2',
    documentIds: ['D22', 'D31'],
    data: {a1: 'Lff', a2: 3440},
  },
  {
    id: 'l16',
    linkTypeId: 'LT2',
    documentIds: ['D22', 'D35'],
    data: {a1: 'L11', a2: 350},
  },
  {
    id: 'l17',
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D34'],
    data: {a1: 'Les', a2: 65},
  },
  {
    id: 'l18',
    linkTypeId: 'LT2',
    documentIds: ['D23', 'D36'],
    data: {a1: 'Lhg', a2: 55},
  },
  {
    id: 'l19',
    linkTypeId: 'LT2',
    documentIds: ['D24', 'D32'],
    data: {a1: 'Lss', a2: 220},
  },
  {
    id: 'l20',
    linkTypeId: 'LT2',
    documentIds: ['D24', 'D33'],
    data: {a1: 'Lmm', a2: 99},
  },
  {
    id: 'l21',
    linkTypeId: 'LT2',
    documentIds: ['D25', 'D34'],
    data: {a1: 'Llg', a2: 81},
  },
  {
    id: 'l22',
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D31'],
    data: {a1: 'Lrr', a2: 61},
  },
  {
    id: 'l23',
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D35'],
    data: {a1: 'Lcx', a2: 39},
  },
  {
    id: 'l24',
    linkTypeId: 'LT2',
    documentIds: ['D26', 'D33'],
    data: {a1: 'Lrf', a2: 92},
  },
  {
    id: 'l25',
    linkTypeId: 'LT3',
    documentIds: ['D31', 'D42'],
    data: {a1: 'Len', a2: 45},
  },
  {
    id: 'l26',
    linkTypeId: 'LT3',
    documentIds: ['D31', 'D43'],
    data: {a1: 'Lsa', a2: 65},
  },
  {
    id: 'l27',
    linkTypeId: 'LT3',
    documentIds: ['D32', 'D45'],
    data: {a1: 'Las', a2: 96},
  },
  {
    id: 'l28',
    linkTypeId: 'LT3',
    documentIds: ['D33', 'D41'],
    data: {a1: 'Lmx', a2: 30},
  },
  {
    id: 'l29',
    linkTypeId: 'LT3',
    documentIds: ['D33', 'D46'],
    data: {a1: 'Lkq', a2: 651},
  },
  {
    id: 'l30',
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D43'],
    data: {a1: 'Ler', a2: 34},
  },
  {
    id: 'l31',
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D44'],
    data: {a1: 'Lww', a2: 67},
  },
  {
    id: 'l32',
    linkTypeId: 'LT3',
    documentIds: ['D34', 'D45'],
    data: {a1: 'Lvb', a2: 11},
  },
  {
    id: 'l33',
    linkTypeId: 'LT3',
    documentIds: ['D35', 'D41'],
    data: {a1: 'Lbo', a2: 77},
  },
  {
    id: 'l34',
    linkTypeId: 'LT3',
    documentIds: ['D35', 'D46'],
    data: {a1: 'Lwl', a2: 83},
  },
  {
    id: 'l35',
    linkTypeId: 'LT3',
    documentIds: ['D36', 'D44'],
    data: {a1: 'Lmy', a2: 19},
  },
];

const query2: Query = {stems: [{collectionId: 'C1', linkTypeIds: ['LT1', 'LT2', 'LT3']}]};

describe('Chart data converter linked collections', () => {
  it('should return empty data', () => {
    const config: ChartConfig = {type: ChartType.Line, axes: {}};
    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    expect(converter.convert(config)).toEqual({
      sets: [
        {
          yAxisType: ChartAxisType.Y1,
          yAxis: {
            category: ChartAxisCategory.Number,
          },
          name: '',
          draggable: false,
          points: [],
          id: null,
          resourceType: AttributesResourceType.Collection,
          color: '#ffffff',
        },
      ],
      type: ChartType.Line,
    });
  });

  it('should return linked data without linked name sum aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C4',
          attributeId: 'a2',
          resourceIndex: 6,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {
        [ChartAxisType.Y1]: DataAggregationType.Sum,
      },
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Dance', y: 428},
      {id: null, x: 'Glass', y: 1420},
      {id: null, x: 'Lmr', y: 680},
      {id: null, x: 'Sport', y: 1808},
    ]);
  });

  it('should return linked data without linked name sum aggregation sorted desc', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C4',
          attributeId: 'a2',
          resourceIndex: 6,
          resourceType: AttributesResourceType.Collection,
        },
      },
      sort: {
        type: ChartSortType.Descending,
        axis: {
          resourceId: 'C1',
          attributeId: 'a2',
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Sum},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
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
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C4',
          attributeId: 'a1',
          resourceIndex: 6,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Sum},
    };

    const points = [
      {id: null, x: 'Dance', y: 'Zas'},
      {id: null, x: 'Glass', y: 'Zlom'},
      {id: null, x: 'Lmr', y: 'Zet'},
      {id: null, x: 'Sport', y: 'Zet'},
    ];

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual(points);
  });

  it('should return linked data without linked name min aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C4',
          attributeId: 'a2',
          resourceIndex: 6,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Min},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Dance', y: 8},
      {id: null, x: 'Glass', y: 1},
      {id: null, x: 'Lmr', y: 1},
      {id: null, x: 'Sport', y: 1},
    ]);
  });

  it('should return linked data without linked name max aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C4',
          attributeId: 'a2',
          resourceIndex: 6,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Max},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Dance', y: 312},
      {id: null, x: 'Glass', y: 333},
      {id: null, x: 'Lmr', y: 333},
      {id: null, x: 'Sport', y: 333},
    ]);
  });

  it('should return linked data without linked name avg aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C4',
          attributeId: 'a2',
          resourceIndex: 6,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Avg},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: null, x: 'Dance', y: 428 / 4},
      {id: null, x: 'Glass', y: 1420 / 14},
      {id: null, x: 'Lmr', y: 680 / 9},
      {id: null, x: 'Sport', y: 1808 / 21},
    ]);
  });

  it('should return linked data with linked name', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C2',
          attributeId: 'a2',
          resourceIndex: 2,
          resourceType: AttributesResourceType.Collection,
        },
      },
      names: {
        [ChartAxisType.Y1]: {
          resourceId: 'C3',
          attributeId: 'a1',
          resourceIndex: 4,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Sum},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(6);
    expect(chartData.sets.map(set => set.name)).toEqual(['Ara', 'As', 'Ant', 'Ask', 'Abc', 'And']);
    expect(chartData.sets[0].points).toContain({id: null, x: 'Sport', y: 320});
    expect(chartData.sets[1].points).toContain({id: 'D23', x: 'Sport', y: 8});
    expect(chartData.sets[2].points).toContain({id: null, x: 'Sport', y: 62});
    expect(chartData.sets[3].points).toContain({id: null, x: 'Sport', y: 126});
    expect(chartData.sets[4].points).toContain({id: null, x: 'Sport', y: 1002});
    expect(chartData.sets[5].points).toContain({id: null, x: 'Sport', y: 1002});
  });
  it('should return data with from linked attributes', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'LT1',
          attributeId: 'a1',
          resourceIndex: 1,
          resourceType: AttributesResourceType.LinkType,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'LT3',
          attributeId: 'a2',
          resourceIndex: 5,
          resourceType: AttributesResourceType.LinkType,
        },
      },
      names: {
        [ChartAxisType.Y1]: {
          resourceId: 'C2',
          attributeId: 'a1',
          resourceIndex: 2,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Sum},
    };

    const converter = new ChartDataConverter();
    converter.updateData(collections2, documents2, permissions2, query2, config, linkTypes2, linkInstances2);
    const chartData = converter.convert(config);
    expect(chartData.sets.length).toEqual(5);
    expect(chartData.sets.map(set => set.name)).toEqual(['Min', 'Max', 'Avg', 'Sum', 'Lep']);
    expect(chartData.sets[0].points).toContain({id: null, x: 'Lmx', y: 777});
    expect(chartData.sets[1].points).toContain({id: null, x: 'Lmp', y: 270});
    expect(chartData.sets[2].points).toContain({id: null, x: 'Lpr', y: 131});
    expect(chartData.sets[3].points).toContain({id: null, x: 'Lxx', y: 777});
    expect(chartData.sets[4].points).toContain({id: null, x: 'Lop', y: 951});
  });
});

describe('Chart data converter constraints', () => {
  it('should return data with percentage constraint', () => {
    const collections3 = [
      {id: 'C1', name: 'C1', color: '', attributes: [{id: 'a1', name: 'Xxx'}]},
      {
        id: 'C2',
        name: 'C2',
        color: '',
        attributes: [{id: 'a1', name: 'Lala', constraint: {type: ConstraintType.Percentage, config: {}}}],
      },
    ];
    const linkTypes3: LinkType[] = [{id: 'LT1', name: 'LinkType1', collectionIds: ['C1', 'C2'], attributes: []}];
    const documentsC1 = [
      {collectionId: 'C1', id: 'D1', data: {a1: 'Martin'}},
      {collectionId: 'C1', id: 'D2', data: {a1: 'Kubo'}},
      {collectionId: 'C1', id: 'D3', data: {a1: 'Tomas'}},
    ];
    const documentsC2 = [
      {collectionId: 'C2', id: 'D21', data: {a1: '0.1'}},
      {collectionId: 'C2', id: 'D22', data: {a1: '0.3'}},
      {collectionId: 'C2', id: 'D23', data: {a1: '0.5'}},
      {collectionId: 'C2', id: 'D24', data: {a1: '0.4'}},
      {collectionId: 'C2', id: 'D25', data: {a1: '0.8'}},
      {collectionId: 'C2', id: 'D26', data: {a1: '0.1'}},
      {collectionId: 'C2', id: 'D27', data: {a1: '0.2'}},
      {collectionId: 'C2', id: 'D28', data: {a1: '0.3'}},
      {collectionId: 'C2', id: 'D29', data: {a1: '0.4'}},
    ];
    const linkInstances3: LinkInstance[] = [
      {id: 'l1', linkTypeId: 'LT1', documentIds: ['D1', 'D21'], data: {}},
      {id: 'l2', linkTypeId: 'LT1', documentIds: ['D1', 'D22'], data: {}},
      {id: 'l3', linkTypeId: 'LT1', documentIds: ['D1', 'D23'], data: {}},
      {id: 'l4', linkTypeId: 'LT1', documentIds: ['D2', 'D24'], data: {}},
      {id: 'l5', linkTypeId: 'LT1', documentIds: ['D2', 'D25'], data: {}},
      {id: 'l6', linkTypeId: 'LT1', documentIds: ['D3', 'D26'], data: {}},
      {id: 'l7', linkTypeId: 'LT1', documentIds: ['D3', 'D27'], data: {}},
      {id: 'l8', linkTypeId: 'LT1', documentIds: ['D3', 'D28'], data: {}},
      {id: 'l9', linkTypeId: 'LT1', documentIds: ['D3', 'D29'], data: {}},
    ];
    const query3: Query = {stems: [{collectionId: 'C1', linkTypeIds: ['LT1']}]};
    const permissions3: Record<string, AllowedPermissions> = {C1: {writeWithView: true}, C2: {writeWithView: true}};

    const configAvg: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {
          resourceId: 'C1',
          attributeId: 'a1',
          resourceIndex: 0,
          resourceType: AttributesResourceType.Collection,
        },
        [ChartAxisType.Y1]: {
          resourceId: 'C2',
          attributeId: 'a1',
          resourceIndex: 2,
          resourceType: AttributesResourceType.Collection,
        },
      },
      aggregations: {[ChartAxisType.Y1]: DataAggregationType.Avg},
    };

    const pointsAvg = [
      {id: null, x: 'Kubo', y: '60'},
      {id: null, x: 'Martin', y: '30'},
      {id: null, x: 'Tomas', y: '25'},
    ];
    const converter = new ChartDataConverter();
    converter.updateData(
      collections3,
      [...documentsC1, ...documentsC2],
      permissions3,
      query3,
      configAvg,
      linkTypes3,
      linkInstances3
    );
    const chartDataAvg = converter.convert(configAvg);
    expect(chartDataAvg.sets.length).toEqual(1);
    expect(chartDataAvg.sets[0].points).toEqual(pointsAvg);

    const configSum = {...configAvg, aggregations: {[ChartAxisType.Y1]: DataAggregationType.Sum}};
    const pointsSum = [
      {id: null, x: 'Kubo', y: '120'},
      {id: null, x: 'Martin', y: '90'},
      {id: null, x: 'Tomas', y: '100'},
    ];
    const chartDataSum = converter.convert(configSum);
    expect(chartDataSum.sets.length).toEqual(1);
    expect(chartDataSum.sets[0].points).toEqual(pointsSum);

    const configMax = {...configAvg, aggregations: {[ChartAxisType.Y1]: DataAggregationType.Max}};
    const pointsMax = [
      {id: null, x: 'Kubo', y: '80'},
      {id: null, x: 'Martin', y: '50'},
      {id: null, x: 'Tomas', y: '40'},
    ];
    const chartDataMax = converter.convert(configMax);
    expect(chartDataMax.sets.length).toEqual(1);
    expect(chartDataMax.sets[0].points).toEqual(pointsMax);

    const configMin = {...configAvg, aggregations: {[ChartAxisType.Y1]: DataAggregationType.Min}};
    const pointsMin = [
      {id: null, x: 'Kubo', y: '40'},
      {id: null, x: 'Martin', y: '10'},
      {id: null, x: 'Tomas', y: '10'},
    ];
    const chartDataMin = converter.convert(configMin);
    expect(chartDataMin.sets.length).toEqual(1);
    expect(chartDataMin.sets[0].points).toEqual(pointsMin);

    const configCount = {...configAvg, aggregations: {[ChartAxisType.Y1]: DataAggregationType.Count}};
    const pointsCount = [{id: null, x: 'Kubo', y: 2}, {id: null, x: 'Martin', y: 3}, {id: null, x: 'Tomas', y: 4}];
    const chartDataCount = converter.convert(configCount);
    expect(chartDataCount.sets.length).toEqual(1);
    expect(chartDataCount.sets[0].points).toEqual(pointsCount);
  });
});
