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

import {createDateTimeOptions} from '../../../date-time/date-time-options';
import {SelectItemModel} from '../../select-item/select-item.model';
import {ConstraintConfigOverrideService} from './constraint-config-override-service';
import {Constraint, DateTimeConstraint, DateTimeConstraintConfig} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../utils/translation.utils';

export enum DateReadableFormatType {
  Yearly = 'yearly',
  Quarterly = 'quarterly',
  Weekly = 'weekly',
  MonthYear = 'monthYear',
  Month = 'month',
  DayMonth = 'dayMonth',
  Day = 'day',
  DayMonthYear = 'dayMonthYear',
  WeekDay = 'weekDay',
  Hour = 'hour',
  HourMinutes = 'hourMinutes',
}

export const dateReadableFormatsMap: Record<string, string> = {
  [DateReadableFormatType.Yearly]: 'YYYY',
  [DateReadableFormatType.Quarterly]: '[Q]Q YYYY',
  [DateReadableFormatType.Weekly]: '[W]W YYYY',
  [DateReadableFormatType.MonthYear]: 'MM.YYYY',
  [DateReadableFormatType.Month]: 'MM',
  [DateReadableFormatType.DayMonth]: 'DD.MM',
  [DateReadableFormatType.Day]: 'DD',
  [DateReadableFormatType.DayMonthYear]: 'DD.MM.YYYY',
  [DateReadableFormatType.WeekDay]: 'ddd',
  [DateReadableFormatType.Hour]: 'HH',
  [DateReadableFormatType.HourMinutes]: 'HH:mm',
};

export class DateTimeConfigOverrideService extends ConstraintConfigOverrideService<DateTimeConstraintConfig> {
  private readonly defaultTitle: string;

  constructor() {
    super();
    this.defaultTitle = $localize`:@@default:Default`;
  }

  public create(config: DateTimeConstraintConfig, withDefaultItem: boolean): SelectItemModel[] {
    const formatTypes = createDateConstraintOverrideFormatTypes(config);
    const defaultItem: SelectItemModel = {id: null, value: this.defaultTitle};
    return [
      ...(withDefaultItem ? [defaultItem] : []),
      ...formatTypes
        .map(type => ({type, format: dateReadableFormatsMap[type]}))
        .filter(({format}) => format !== config.format)
        .map(({type, format}) => ({
          id: new DateTimeConstraint({format} as DateTimeConstraintConfig),
          value: this.translateDateReadableFormatType(type),
        })),
    ];
  }

  public isValidOverride(constraint: Constraint, overrideConstraint: Constraint): Constraint {
    const config = constraint.config as DateTimeConstraintConfig;
    const overrideConfig = overrideConstraint.config as DateTimeConstraintConfig;
    if (overrideConfig.format) {
      const validFormats = createDateConstraintOverrideFormatTypes(config).map(type => dateReadableFormatsMap[type]);
      const overrideFormat = validFormats.includes(overrideConfig.format)
        ? this.translateDateReadableFormat(overrideConfig.format)
        : null;
      return overrideFormat && new DateTimeConstraint({...config, format: overrideFormat});
    }
    return constraint;
  }

  private translateDateReadableFormat(format: string): string {
    const formatType = Object.entries(DateReadableFormatType).find(([, value]) => value === format);
    if (formatType && formatType[0] === DateReadableFormatType.Weekly) {
      return parseSelectTranslation(
        $localize`:@@select.constraint.items.date.format:{format, select, weekly {[W]W YYYY} other {}}`,
        {format: formatType[0]}
      );
    }
    return format;
  }

  private translateDateReadableFormatType(type: DateReadableFormatType): string {
    return parseSelectTranslation(
      $localize`:@@select.constraint.items.date.formatType:{type, select, yearly {Years} quarterly {Quarters} weekly {Weeks} monthYear {Months and years} month {Months} dayMonth {Days and months} day {Days} dayMonthYear {Days, months and years} weekDay {Day of week} hour {Hours} hourMinutes {Hours and minutes} }`,
      {type}
    );
  }
}

function createDateConstraintOverrideFormatTypes(config: DateTimeConstraintConfig): DateReadableFormatType[] {
  const options = createDateTimeOptions(config.format);
  const formats = [];
  if (options.year && (options.month || options.day)) {
    formats.push(DateReadableFormatType.Yearly, DateReadableFormatType.Quarterly, DateReadableFormatType.Weekly);
  }
  if (options.year && options.month && options.day) {
    formats.push(
      DateReadableFormatType.MonthYear,
      DateReadableFormatType.Month,
      DateReadableFormatType.DayMonth,
      DateReadableFormatType.Day,
      DateReadableFormatType.WeekDay
    );
  }
  if (options.year && options.month && options.day && (options.hours || options.minutes)) {
    formats.push(DateReadableFormatType.DayMonthYear);
  }
  if (options.hours && options.minutes) {
    formats.push(DateReadableFormatType.Hour);
  }
  if (options.hours && options.minutes && options.seconds) {
    formats.push(DateReadableFormatType.HourMinutes);
  }

  return formats;
}
