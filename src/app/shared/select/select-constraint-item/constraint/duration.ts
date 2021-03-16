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

import {SelectItemModel} from '../../select-item/select-item.model';
import {ConstraintConfigOverrideService} from './constraint-config-override-service';
import {Constraint, DurationConstraint, DurationConstraintConfig, DurationUnit} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../utils/translation.utils';

const maxDurationUnits = [DurationUnit.Days, DurationUnit.Hours, DurationUnit.Minutes, DurationUnit.Seconds];

export class DurationConfigOverrideService extends ConstraintConfigOverrideService<DurationConstraintConfig> {
  private readonly defaultTitle: string;

  constructor() {
    super();
    this.defaultTitle = $localize`:@@default:Default`;
  }

  public create(config: DurationConstraintConfig, withDefaultItem: boolean): SelectItemModel[] {
    const defaultItem: SelectItemModel = {id: null, value: this.defaultTitle};
    return [
      ...(withDefaultItem ? [defaultItem] : []),
      ...maxDurationUnits.map(unit => ({
        id: new DurationConstraint({maxUnit: unit} as DurationConstraintConfig),
        value: this.translateDurationUnit(unit),
      })),
    ];
  }

  private translateDurationUnit(unit: DurationUnit): string {
    return parseSelectTranslation(
      $localize`:@@select.constraint.items.duration.maxUnit:{unit, select, w {weeks} d {days} h {hours} m {minutes} s {seconds}}`,
      {unit}
    );
  }

  public isValidOverride(constraint: Constraint, overrideConstraint: Constraint): Constraint {
    const config = constraint.config as DurationConstraintConfig;
    const overrideConfig = overrideConstraint.config as DurationConstraintConfig;
    if (overrideConfig.maxUnit) {
      const maxUnit = maxDurationUnits.includes(overrideConfig.maxUnit) ? overrideConfig.maxUnit : null;
      return maxUnit && new DurationConstraint({...config, maxUnit});
    }
    return constraint;
  }
}
