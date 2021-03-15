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

import {Injectable} from '@angular/core';
import {Attribute} from '../../../core/store/collections/collection';
import {SelectItemModel} from '../select-item/select-item.model';
import {DateTimeConfigOverrideService} from './constraint/date-time';
import {DurationConfigOverrideService} from './constraint/duration';
import {Constraint, ConstraintType, DateTimeConstraintConfig, DurationConstraintConfig} from '@lumeer/data-filters';

@Injectable({
  providedIn: 'root',
})
export class SelectItemWithConstraintFormatter {
  private readonly dateTimeConfigOverrideService: DateTimeConfigOverrideService;
  private readonly durationConfigOverrideService: DurationConfigOverrideService;

  constructor() {
    this.dateTimeConfigOverrideService = new DateTimeConfigOverrideService();
    this.durationConfigOverrideService = new DurationConfigOverrideService();
  }

  public createItems(attribute: Attribute, withDefaultItem = true): SelectItemModel[] {
    if (!attribute || !attribute.constraint) {
      return [];
    }

    switch (attribute.constraint.type) {
      case ConstraintType.DateTime:
        return this.dateTimeConfigOverrideService.create(
          attribute.constraint.config as DateTimeConstraintConfig,
          withDefaultItem
        );
      case ConstraintType.Duration:
        return this.durationConfigOverrideService.create(
          attribute.constraint.config as DurationConstraintConfig,
          withDefaultItem
        );
      default:
        return [];
    }
  }

  public checkValidConstraintOverride(constraint: Constraint, overrideConstraint: Constraint): Constraint {
    if (!overrideConstraint || !constraint || constraint.type !== overrideConstraint.type) {
      return constraint;
    }

    switch (constraint?.type) {
      case ConstraintType.DateTime:
        return this.dateTimeConfigOverrideService.isValidOverride(constraint, overrideConstraint);
      case ConstraintType.Duration:
        return this.durationConfigOverrideService.isValidOverride(constraint, overrideConstraint);
      default:
        return constraint;
    }
  }
}
