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
import {Pipe, PipeTransform} from '@angular/core';

import {DataAggregationType} from '@lumeer/data-filters';

import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {dataAggregationIconMap, dataAggregationName} from '../../utils/data-aggregation';
import {TableFooterCell} from '../model/table-footer';

@Pipe({
  name: 'tableFooterCellDropdownOptions',
})
export class TableFooterCellDropdownOptionsPipe implements PipeTransform {
  public transform(cell: TableFooterCell): DropdownOption[] {
    return (cell.types || []).map(aggregation => ({
      value: aggregation,
      displayValue: this.dataAggregationName(cell, aggregation),
      icons: [dataAggregationIconMap[aggregation]],
    }));
  }

  private dataAggregationName(cell: TableFooterCell, aggregation: DataAggregationType): string {
    const value = cell.typesFormattedValues?.[aggregation] ?? '';
    return `${dataAggregationName(aggregation)}: ${value}`;
  }
}
