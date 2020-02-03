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

import {deepObjectsEquals, isNotNullOrUndefined} from '../../../shared/utils/common.utils';
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {formatCoordinates, parseCoordinates} from '../../../shared/utils/map/coordinates.utils';
import {MapCoordinates} from '../../store/maps/map.model';
import {CoordinatesConstraintConfig, CoordinatesFormat} from '../data/constraint-config';
import {DataValue} from './index';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByText, valueMeetFulltexts} from './data-value.utils';

export class CoordinatesDataValue implements DataValue {
  public readonly coordinates: MapCoordinates;

  constructor(
    public readonly value: any,
    public readonly config: CoordinatesConstraintConfig,
    public readonly inputValue?: string
  ) {
    this.coordinates = parseCoordinates(value);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (!this.coordinates) {
      return formatUnknownDataValue(this.value);
    }

    return formatCoordinates(this.coordinates, this.config.format, this.config.precision);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return this.coordinates ? formatCoordinates(this.coordinates, CoordinatesFormat.DecimalDegrees, 6) : '';
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return isNotNullOrUndefined(this.inputValue) || !!this.coordinates;
  }

  public increment(): CoordinatesDataValue {
    return undefined; // not supported at the moment but can be implemented later
  }

  public decrement(): CoordinatesDataValue {
    return undefined; // not supported at the moment but can be implemented later
  }

  public compareTo(otherValue: CoordinatesDataValue): number {
    if (deepObjectsEquals(this.coordinates, otherValue.coordinates)) {
      return 0;
    }

    return this.format().localeCompare(otherValue.format());
  }

  public copy(newValue?: any): CoordinatesDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new CoordinatesDataValue(value, this.config);
  }

  public parseInput(inputValue: string): CoordinatesDataValue {
    return new CoordinatesDataValue(inputValue, this.config, inputValue);
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new CoordinatesDataValue(value.value, this.config));
    const formattedValue = this.format()
      .trim()
      .toLowerCase();
    const otherFormattedValues = dataValues.map(dataValue =>
      dataValue
        .format()
        .trim()
        .toLowerCase()
    );

    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }
}
