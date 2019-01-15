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
import {ChartAggregation, ChartAxisType, ChartConfig, ChartType} from '../../../../core/store/charts/chart';
import {convertChartData} from './data-convertor';
import {ChartYAxisType} from './chart-data';

const documents: DocumentModel[] = [
  {
    collectionId: 'C1',
    id: 'D1',
    data: {
      a1: 'Sport',
      a2: 3,
      a3: 'Mama',
    },
  },
  {
    collectionId: 'C1',
    id: 'D2',
    data: {
      a1: 'Dance',
      a2: 7,
      a3: 'Salt',
    },
  },
  {
    collectionId: 'C1',
    id: 'D3',
    data: {
      a1: 'Glass',
      a2: 44,
    },
  },
  {
    collectionId: 'C1',
    id: 'D4',
    data: {
      a1: 'Sport',
      a2: 0,
      a3: 'Dendo',
    },
  },
  {
    collectionId: 'C1',
    id: 'D5',
    data: {
      a1: 'Glass',
      a2: 7,
      a3: 'Vibes',
    },
  },
];

const collections: Collection[] = [
  {
    id: 'C1',
    name: 'collection',
    color: '#ffffff',
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}, {id: 'a3', name: 'a3'}],
  },
  {
    id: 'C2',
    name: 'collection',
    color: '#bcbcbcb',
    attributes: [{id: 'a1', name: 'a1'}, {id: 'a2', name: 'a2'}],
  },
];

fdescribe('Chart data converter', () => {
  fit('should return empty data', () => {
    const query: Query = {stems: [{collectionId: 'C1'}]};
    const config: ChartConfig = {type: ChartType.Line, axes: {}};
    expect(convertChartData(config, documents, collections, query)).toEqual({
      sets: [],
      legend: {entries: []},
      type: ChartType.Line,
    });
  });

  fit('should return data by x', () => {
    const query: Query = {stems: [{collectionId: 'C1'}]};
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
    const query: Query = {stems: [{collectionId: 'C1'}]};
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
    const query: Query = {stems: [{collectionId: 'C1'}]};
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
    const query: Query = {stems: [{collectionId: 'C1'}]};
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
