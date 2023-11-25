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

import {ConstraintType} from '@lumeer/data-filters';
import {LmrPivotTableCell} from '@lumeer/pivot';

import {DataInputConfiguration} from '../../../../shared/data-input/data-input-configuration';

@Pipe({
  name: 'pivotCellConfiguration',
})
export class PivotCellConfigurationPipe implements PipeTransform {
  public readonly configuration: DataInputConfiguration = {common: {inline: true, minWidth: 40, inheritColor: true}};

  public transform(cell: LmrPivotTableCell): DataInputConfiguration {
    const constraintType = cell?.constraint?.type;
    if (constraintType === ConstraintType.Boolean) {
      return {...this.configuration, boolean: {additionalLabel: cell.label}};
    }

    return this.configuration;
  }
}
