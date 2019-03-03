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

import {ChartAxisResourceType, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart';

export interface ChartData {
  sets: ChartDataSet[];
  type: ChartType;
}

export interface ChartDataSet {
  id: string;
  points: ChartPoint[];
  color: string;
  isNumeric: boolean;
  yAxisType: ChartYAxisType;
  name: string;
  draggable: boolean;
  resourceType: ChartAxisResourceType;
}

export interface ChartPoint {
  id?: string;
  x?: any;
  y?: any;
  isPrediction?: boolean;
}

export type ChartYAxisType = ChartAxisType.Y1 | ChartAxisType.Y2;
