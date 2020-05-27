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

import {ChartAxisSettings, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {ConstraintType} from '../../../../../core/model/data/constraint';

export interface ChartData {
  sets: ChartDataSet[];
  type: ChartType;
  xAxisData?: ChartAxisData;
  y1AxisData?: ChartAxisData;
  y2AxisData?: ChartAxisData;
}

export interface ChartDataSet {
  id: string;
  points: ChartPoint[];
  draggable: boolean;
  yAxisType: ChartYAxisType;
  name: string;
  resourceType: AttributesResourceType;
  color?: string;
}

export interface ChartPoint {
  id?: string;
  x?: any;
  y?: any;
  title?: string;
  color?: string;
  isPrediction?: boolean;
}

export interface ChartAxisData {
  formatter?: (x: number) => string;
  range?: [number, number];
  ticks?: ChartAxisTick[];
  constraintType: ConstraintType;
}

export interface ChartAxisTick {
  value: any;
  title: string;
}

export type ChartYAxisType = ChartAxisType.Y1 | ChartAxisType.Y2;

export interface ChartSettings {
  rangeSlider?: boolean;
  settings?: Partial<Record<ChartAxisType, ChartAxisSettings>>;
}
