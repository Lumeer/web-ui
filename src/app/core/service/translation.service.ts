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
import {objectValues} from '../../shared/utils/common.utils';
import {
  ConditionType,
  Constraint,
  ConstraintConditionValue,
  ConstraintType,
  DateTimeConstraintConditionValue,
  DurationUnit,
  LanguageTag,
  UserConstraintConditionValue,
} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../shared/utils/translation.utils';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  public createCurrencyAbbreviations(): string[] {
    return $localize`:@@currency.abbreviations:k|m|b|t`.split('|');
  }

  public createCurrencyOrdinals(): string[] {
    return $localize`:@@currency.ordinals:st|nd|rd|th`.split('|');
  }

  public createDurationUnitsMap(): Record<DurationUnit | string, string> {
    return objectValues(DurationUnit).reduce((map, unit) => ({...map, [unit]: this.translateDurationUnit(unit)}), {});
  }

  public translateDurationUnit(unit: DurationUnit): string {
    return parseSelectTranslation(
      $localize`:@@constraint.duration.unit:{unit, select, w {w} d {d} h {h} m {m} s {s}}`,
      {unit}
    );
  }

  public translateQueryCondition(condition: ConditionType, constraint: Constraint): string {
    if (!constraint) {
      return this.translateConditionByText(condition);
    }

    switch (constraint.type) {
      case ConstraintType.Text:
      case ConstraintType.Address:
        return this.translateConditionByText(condition);
      case ConstraintType.Select:
      case ConstraintType.User:
        return this.translateConditionByUserAndSelect(condition);
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

  public translateLanguageTag(tag: LanguageTag): string {
    return parseSelectTranslation(
      $localize`:@@constraint.number.currency.select:{tag, select, en-IN {India - ₹ (INR)} uk-UA {Ukraine - ₴ (UAH)} tr-TR {Turkey - ₺ (TRY)} en-MT {Malta - € (EUR)} en-IE {Ireland - € (EUR)} da-DK {Denmark - kr (DKK)} de-CH {Switzerland - CHF} en-NZ {New Zealand - $ (NZD)} fr-CA {Canada - $ (CAD)} sv-SE {Sweden - kr (SEK)} nb-NO {Norway - kr (NOK)} fi-FI {Finland - € (EUR)} he-IL {Israel - ₪ (ILS)} es-ES {Spain - € (EUR)} fr-FR {France - € (EUR)} it-IT {Italy - € (EUR)} en-GB {United Kingdom - £ (GBP)} pt-PT {Portugal - € (EUR)} pl-PL {Poland - zł (PLN)} cs-CZ {Czech Republic - Kč (CZK)} sk-SK {Slovak Republic - € (EUR)} hu-HU {Hungary - Ft (HUF)} de-AT {Austria - € (EUR)} de-DE {Germany - € (EUR)} en-US {United States - $ (USD)} pt-BR {Brazil - R$ (BRL)} zh-TW {Taiwan - NT$ (TWD)} nl-NL {Netherland - € (EUR)} zh-CN {China - ¥ (CNY)} ru-RU {Russia - ₽ (RUB)} ja-JP {Japan - ¥ (JPY)} en-AU {Australia - $ (AUD)}}`,
      {tag}
    );
  }

  private translateConditionByUserAndSelect(condition: ConditionType): string {
    return parseSelectTranslation(
      $localize`:@@query.filter.condition.constraint.select:{condition, select, eq {In} neq {Has None Of} in {In} nin {Has None Of} hasAll {Has All} hasSome {Has Some} empty {Is Empty} notEmpty {Is Not Empty}}`,
      {condition}
    );
  }

  private translateConditionByText(condition: ConditionType): string {
    return parseSelectTranslation(
      $localize`:@@query.filter.condition.constraint.text:{condition, select, eq {Is} neq {Is Not} contains {Contains} notContains {Does Not Contain} startsWith {Starts With} endsWith {Ends With} in {In} nin {Not In} empty {Is Empty} notEmpty {Is Not Empty} enabled {Is Enabled} disabled {Is Disabled}}`,
      {condition}
    );
  }

  private translateConditionByNumber(condition: ConditionType): string {
    switch (condition) {
      case ConditionType.Equals:
        return '=';
      case ConditionType.NotEquals:
        return '≠';
      case ConditionType.GreaterThan:
        return '>';
      case ConditionType.GreaterThanEquals:
        return '≥';
      case ConditionType.LowerThan:
        return '<';
      case ConditionType.LowerThanEquals:
        return '≤';
    }

    return parseSelectTranslation(
      $localize`:@@query.filter.condition.constraint.number:{condition, select, between {Range} notBetween {Not From Range} empty {Is Empty} notEmpty {Is Not Empty}}`,
      {condition}
    );
  }

  private translateConditionByDate(condition: ConditionType): string {
    return parseSelectTranslation(
      $localize`:@@query.filter.condition.constraint.date:{condition, select, eq {Is} neq {Is Not} gt {Is After} lt {Is Before} gte {Is On Or After} lte {Is On Or Before} between {Is Between} notBetween {Is Not Between} empty {Is Empty} notEmpty {Is Not Empty}}`,
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
    return parseSelectTranslation(
      $localize`:@@query.filter.condition.value.constraint.date:{condition, select, today {Today} yesterday {Yesterday} tomorrow {Tomorrow} thisWeek {This Week} thisMonth {This Month} lastWeek {Last Week} lastMonth {Last Month} nextMonth {Next Month} nextWeek {Next Week}}`,
      {condition}
    );
  }

  private translateUserConstraintConditionValue(type: UserConstraintConditionValue): string {
    return parseSelectTranslation(
      $localize`:@@query.filter.condition.value.constraint.user:{type, select, currentUser {Current User}}`,
      {type}
    );
  }
}
