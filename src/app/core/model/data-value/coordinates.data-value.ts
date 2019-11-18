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

import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {formatCoordinates, parseCoordinates} from '../../../shared/utils/map/coordinates.utils';
import {MapCoordinates} from '../../store/maps/map.model';
import {CoordinatesConstraintConfig, CoordinatesFormat} from '../data/constraint-config';
import {DataValue, DataValueInputType} from './index';

export class CoordinatesDataValue implements DataValue {
  public readonly coordinates: MapCoordinates;

  constructor(
    public readonly value: any,
    public readonly inputType: DataValueInputType,
    public readonly config: CoordinatesConstraintConfig
  ) {
    this.coordinates = parseCoordinates(value);
  }

  public format(): string {
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
    return !!this.coordinates;
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

    return -1; // TODO calculate distance?
  }

  public copy(newValue?: any): CoordinatesDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new CoordinatesDataValue(value, DataValueInputType.Copied, this.config);
  }

  public parseInput(inputValue: string): CoordinatesDataValue {
    return new CoordinatesDataValue(inputValue, DataValueInputType.Typed, this.config);
  }
}
