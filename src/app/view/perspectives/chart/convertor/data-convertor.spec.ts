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

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {Query} from '../../../../core/store/navigation/query';
import {
  ChartAggregation,
  ChartAxisType,
  ChartConfig,
  ChartSortType,
  ChartType,
} from '../../../../core/store/charts/chart';
import {convertChartData} from './data-convertor';
import {ChartYAxisType} from './chart-data';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';

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
  },
];

const query: Query = {stems: [{collectionId: 'C1'}]};

fdescribe('Chart data converter single collection', () => {
  it('should return empty data', () => {
    const config: ChartConfig = {type: ChartType.Line, axes: {}};
    expect(convertChartData(config, documents, collections, query)).toEqual({
      sets: [],
      legend: {entries: []},
      type: ChartType.Line,
    });
  });

  fit('should return data by x', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {[ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0}},
    };
    const set = {
      id: 'C1',
      points: [
        {id: 'D1', x: 'Sport', y: undefined},
        {id: 'D2', x: 'Dance', y: undefined},
        {id: 'D3', x: 'Glass', y: undefined},
      ],
      color: '#ffffff',
      isNumeric: false,
      yAxisType: ChartYAxisType.Y1,
    };
    expect(convertChartData(config, documents, collections, query)).toEqual({
      sets: [set],
      legend: {entries: []},
      type: ChartType.Line,
    });
  });

  fit('should return data by y', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {[ChartAxisType.Y1]: {collectionId: 'C1', attributeId: 'a2', collectionIndex: 0}},
    };
    const set = {
      id: 'C1',
      points: [
        {id: 'D1', x: undefined, y: 3},
        {id: 'D2', x: undefined, y: 7},
        {id: 'D3', x: undefined, y: 44},
        {id: 'D4', x: undefined, y: 0},
      ],
      color: '#ffffff',
      isNumeric: true,
      yAxisType: ChartYAxisType.Y1,
    };
    expect(convertChartData(config, documents, collections, query)).toEqual({
      sets: [set],
      legend: {entries: []},
      type: ChartType.Line,
    });
  });

  fit('should return data aggregated simple', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C1', attributeId: 'a2', collectionIndex: 0},
      },
      aggregation: ChartAggregation.Sum,
    };
    const set = {
      id: 'C1',
      points: [{id: undefined, x: 'Sport', y: 3}, {id: 'D2', x: 'Dance', y: 7}, {id: undefined, x: 'Glass', y: 51}],
      color: '#ffffff',
      isNumeric: true,
      yAxisType: ChartYAxisType.Y1,
    };
    expect(convertChartData(config, documents, collections, query)).toEqual({
      sets: [set],
      legend: {entries: []},
      type: ChartType.Line,
    });

    const config2 = {...config, aggregation: ChartAggregation.Min};
    const set2 = {
      ...set,
      points: [{id: undefined, x: 'Sport', y: 0}, {id: 'D2', x: 'Dance', y: 7}, {id: undefined, x: 'Glass', y: 7}],
    };
    expect(convertChartData(config2, documents, collections, query)).toEqual({
      sets: [set2],
      legend: {entries: []},
      type: ChartType.Line,
    });

    const config3 = {...config, aggregation: undefined};
    const set3 = {
      ...set,
      points: [
        {id: 'D1', x: 'Sport', y: 3},
        {id: 'D2', x: 'Dance', y: 7},
        {id: 'D3', x: 'Glass', y: 44},
        {id: 'D4', x: 'Sport', y: 0},
        {id: 'D5', x: 'Glass', y: 7},
      ],
    };
    expect(convertChartData(config3, documents, collections, query)).toEqual({
      sets: [set3],
      legend: {entries: []},
      type: ChartType.Line,
    });
  });

  fit('should return data by Y1 and Y2', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C1', attributeId: 'a2', collectionIndex: 0},
        [ChartAxisType.Y2]: {collectionId: 'C1', attributeId: 'a3', collectionIndex: 0},
      },
      aggregation: ChartAggregation.Sum,
    };
    const points1 = [
      {id: undefined, x: 'Sport', y: 3},
      {id: 'D2', x: 'Dance', y: 7},
      {id: undefined, x: 'Glass', y: 51},
    ];
    const points2 = [{id: 'D2', x: 'Dance', y: 'Salt'}, {id: 'D5', x: 'Glass', y: 'Vibes'}];

    const chartData1 = convertChartData(config, documents, collections, query);
    expect(chartData1.sets.length).toEqual(2);
    expect(chartData1.sets[0].points).toEqual(points1);
    expect(chartData1.sets[1].points).toEqual(points2);

    const config2 = {...config, aggregation: undefined};
    const chartData2 = convertChartData(config2, documents, collections, query);
    const points3 = [
      {id: 'D1', x: 'Sport', y: 3},
      {id: 'D2', x: 'Dance', y: 7},
      {id: 'D3', x: 'Glass', y: 44},
      {id: 'D4', x: 'Sport', y: 0},
      {id: 'D5', x: 'Glass', y: 7},
    ];
    const points4 = [
      {id: 'D1', x: 'Sport', y: 'Mama'},
      {id: 'D2', x: 'Dance', y: 'Salt'},
      {id: 'D3', x: 'Glass', y: undefined},
      {id: 'D4', x: 'Sport', y: 'Dendo'},
      {id: 'D5', x: 'Glass', y: 'Vibes'},
    ];
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

fdescribe('Chart data converter linked collections', () => {
  fit('should return empty data', () => {
    const config: ChartConfig = {type: ChartType.Line, axes: {}};
    expect(convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2)).toEqual({
      sets: [],
      legend: {entries: []},
      type: ChartType.Line,
    });
  });

  fit('should return linked data without linked name sum aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregation: ChartAggregation.Sum,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: undefined, x: 'Sport', y: 1808},
      {id: undefined, x: 'Dance', y: 428},
      {id: undefined, x: 'Glass', y: 1420},
      {id: undefined, x: 'Lmr', y: 680},
    ]);
  });

  fit('should return linked data without linked name sum aggregation sorted desc', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      sort: {
        type: ChartSortType.Descending,
        collectionId: 'C1',
        attributeId: 'a2',
      },
      aggregation: ChartAggregation.Sum,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: undefined, x: 'Lmr', y: 680},
      {id: undefined, x: 'Glass', y: 1420},
      {id: undefined, x: 'Dance', y: 428},
      {id: undefined, x: 'Sport', y: 1808},
    ]);
  });

  fit('should return linked data without linked name sum aggregation non numeric', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a1', collectionIndex: 3},
      },
      aggregation: ChartAggregation.Sum,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([]);
  });

  fit('should return linked data without linked name min aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregation: ChartAggregation.Min,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: undefined, x: 'Sport', y: 1},
      {id: undefined, x: 'Dance', y: 8},
      {id: undefined, x: 'Glass', y: 1},
      {id: undefined, x: 'Lmr', y: 1},
    ]);
  });

  fit('should return linked data without linked name max aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregation: ChartAggregation.Max,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: undefined, x: 'Sport', y: 333},
      {id: undefined, x: 'Dance', y: 312},
      {id: undefined, x: 'Glass', y: 333},
      {id: undefined, x: 'Lmr', y: 333},
    ]);
  });

  fit('should return linked data without linked name avg aggregation', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C4', attributeId: 'a2', collectionIndex: 3},
      },
      aggregation: ChartAggregation.Avg,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(1);
    expect(chartData.sets[0].points).toEqual([
      {id: undefined, x: 'Sport', y: 1808 / 21},
      {id: undefined, x: 'Dance', y: 428 / 4},
      {id: undefined, x: 'Glass', y: 1420 / 14},
      {id: undefined, x: 'Lmr', y: 680 / 9},
    ]);
  });

  fit('should return linked data with linked name', () => {
    const config: ChartConfig = {
      type: ChartType.Line,
      axes: {
        [ChartAxisType.X]: {collectionId: 'C1', attributeId: 'a1', collectionIndex: 0},
        [ChartAxisType.Y1]: {collectionId: 'C2', attributeId: 'a2', collectionIndex: 1},
      },
      names: {
        [ChartAxisType.Y1]: {collectionId: 'C3', attributeId: 'a1', collectionIndex: 2},
      },
      aggregation: ChartAggregation.Sum,
    };

    const chartData = convertChartData(config, documents2, collections2, query2, linkTypes2, linkInstances2);
    expect(chartData.sets.length).toEqual(6);
    expect(chartData.legend.entries.map(entry => entry.value)).toEqual(['Ask', 'Ant', 'Abc', 'And', 'Ara', 'As']);
    expect(chartData.sets[0].points).toContain({x: 'Sport', y: 126});
    expect(chartData.sets[1].points).toContain({x: 'Sport', y: 62});
    expect(chartData.sets[2].points).toContain({x: 'Sport', y: 1002});
    expect(chartData.sets[3].points).toContain({x: 'Sport', y: 1002});
    expect(chartData.sets[4].points).toContain({x: 'Sport', y: 320});
    expect(chartData.sets[5].points).toContain({x: 'Sport', y: 8});
  });
});
