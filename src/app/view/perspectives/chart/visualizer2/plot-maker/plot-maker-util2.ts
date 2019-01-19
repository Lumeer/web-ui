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

import {ChartType} from '../../../../../core/store/charts/chart';
import {PlotMaker2} from './plot-maker2';
import {PiePlotMaker2} from './pie-plot-maker2';
import {BarPlotMaker2} from './bar-plot-maker2';
import {LinePlotMaker2} from './line-plot-maker2';
import {ElementRef} from '@angular/core';

export function createPlotMakerByType(type: ChartType, element: ElementRef): PlotMaker2 {
  switch (type) {
    case ChartType.Pie:
      return new PiePlotMaker2(element);
    case ChartType.Bar:
      return new BarPlotMaker2(element);
    case ChartType.Line:
      return new LinePlotMaker2(element);
  }
}
