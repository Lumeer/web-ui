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
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DurationUnit} from '../model/data/constraint-config';
import {QueryCondition} from '../store/navigation/query/query';
import {Constraint} from '../model/constraint';
import {ConstraintType} from '../model/data/constraint';
import {
  ConstraintConditionValue,
  DateTimeConstraintConditionValue,
  UserConstraintConditionValue,
} from '../model/data/constraint-condition';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  constructor(private i18n: I18n) {}

  public createDurationUnitsMap(): Record<DurationUnit, string> {
    return Object.values(DurationUnit).reduce((map, unit) => ({...map, [unit]: this.translateDurationUnit(unit)}), {});
  }

  public translateDurationUnit(unit: DurationUnit): string {
    return this.i18n(
      {
        id: 'constraint.duration.unit',
        value: '{unit, select, w {w} d {d} h {h} m {m} s {s}}',
      },
      {unit}
    );
  }

  public translateQueryCondition(condition: QueryCondition, constraint: Constraint): string {
    if (!constraint) {
      return this.translateConditionByText(condition);
    }

    switch (constraint.type) {
      case ConstraintType.Text:
      case ConstraintType.Address:
        return this.translateConditionByText(condition);
      case ConstraintType.Number:
      case ConstraintType.Percentage:
      case ConstraintType.Duration:
        return this.translateConditionByNumber(condition);
      case ConstraintType.DateTime:
        return this.translateConditionByDate(condition);
      default:
        return this.translateConditionByText(condition);
    }
  }

  private translateConditionByText(condition: QueryCondition): string {
    return this.i18n(
      {
        id: 'query.filter.condition.constraint.text',
        value:
          '{condition, select, eq {Is} neq {Is Not} contains {Contains} notContains {Does Not Contain} startsWith {Starts With} endsWith {Ends With} in {In} nin {Not In} empty {Is Empty} notEmpty {Is Not Empty}}',
      },
      {condition}
    );
  }

  private translateConditionByNumber(condition: QueryCondition): string {
    switch (condition) {
      case QueryCondition.Equals:
        return '=';
      case QueryCondition.NotEquals:
        return '≠';
      case QueryCondition.GreaterThan:
        return '>';
      case QueryCondition.GreaterThanEquals:
        return '≥';
      case QueryCondition.LowerThan:
        return '<';
      case QueryCondition.LowerThanEquals:
        return '≤';
    }

    return this.i18n(
      {
        id: 'query.filter.condition.constraint.number',
        value:
          '{condition, select, between {Range} notBetween {Not From Range} empty {Is Empty} notEmpty {Is Not Empty}}',
      },
      {condition}
    );
  }

  private translateConditionByDate(condition: QueryCondition): string {
    return this.i18n(
      {
        id: 'query.filter.condition.constraint.date',
        value:
          '{condition, select, eq {Is} neq {Is Not} gt {Is After} lt {Is Before} gte {Is On Or After} lte {Is On Or Before} between {Is Between} notBetween {Is Not Between} empty {Is Empty} notEmpty {Is Not Empty}}',
      },
      {condition}
    );
  }

  public translateConstraintConditionValue(type: ConstraintConditionValue, constraint: Constraint): string {
    if (!constraint) {
      return null;
    }

    switch (constraint.type) {
      case ConstraintType.User:
        return this.translateUserConstraintConditionValue(type as UserConstraintConditionValue);
      case ConstraintType.DateTime:
        return this.translateDateConstraintConditionValue(type as DateTimeConstraintConditionValue);
      default:
        return null;
    }
  }

  private translateDateConstraintConditionValue(condition: DateTimeConstraintConditionValue): string {
    return this.i18n(
      {
        id: 'query.filter.condition.value.constraint.date',
        value:
          '{condition, select, today {Today} yesterday {Yesterday} tomorrow {Tomorrow} thisWeek {This Week} thisMonth {This Month} lastWeek {Last Week} lastMonth {Last Month} nextMonth {Next Month} nextWeek {Next Week}}',
      },
      {condition}
    );
  }

  private translateUserConstraintConditionValue(type: UserConstraintConditionValue): string {
    return this.i18n(
      {
        id: 'query.filter.condition.value.constraint.user',
        value: '{type, select, currentUser {Current User}}',
      },
      {type}
    );
  }
}
