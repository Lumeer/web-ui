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

import {
  Constraint,
  ConstraintData,
  ConstraintType,
  DateTimeConstraintConfig,
  DurationConstraintConfig,
  UnknownConstraint,
} from '@lumeer/data-filters';

import {Attribute} from '../../../core/store/collections/collection';
import {SelectItemModel} from '../select-item/select-item.model';
import {DateTimeConfigOverrideService} from './constraint/date-time';
import {DurationConfigOverrideService} from './constraint/duration';

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

  public serializeValueWithConstraintOverride(
    value: any,
    constraint: Constraint,
    overrideConstraint: Constraint,
    constraintData: ConstraintData
  ): any {
    const overriddenConstraint = this.checkValidConstraintOverride(constraint, overrideConstraint);

    switch (overriddenConstraint?.type) {
      case ConstraintType.DateTime:
      case ConstraintType.Duration:
        const serializedValue = constraint.createDataValue(value, constraintData).serialize();
        return overriddenConstraint.createDataValue(serializedValue, constraintData).format();
      default:
        return (overriddenConstraint || constraint || new UnknownConstraint())
          .createDataValue(value, constraintData)
          .serialize();
    }
  }

  public formatValueWithConstraintOverride(
    value: any,
    constraint: Constraint,
    overrideConstraint: Constraint,
    constraintData: ConstraintData
  ): any {
    const overriddenConstraint = this.checkValidConstraintOverride(constraint, overrideConstraint);
    const serializedValue = (constraint || new UnknownConstraint()).createDataValue(value, constraintData).serialize();
    return (overriddenConstraint || constraint || new UnknownConstraint())
      .createDataValue(serializedValue, constraintData)
      .format();
  }
}
