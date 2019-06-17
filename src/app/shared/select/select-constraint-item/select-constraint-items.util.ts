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

import {Attribute} from '../../../core/store/collections/collection';
import {SelectItemModel} from '../select-item/select-item.model';
import {ConstraintType, DateTimeConstraintConfig} from '../../../core/model/data/constraint';
import {createDateTimeOptions} from '../../date-time/date-time-options';

export function createSelectConstraintItems(attribute: Attribute, defaultTitle: string): SelectItemModel[] {
  if (!attribute || !attribute.constraint) {
    return [];
  }

  switch (attribute.constraint.type) {
    case ConstraintType.DateTime:
      return createSelectDateConstraintItems(attribute.constraint.config as DateTimeConstraintConfig, defaultTitle);
    default:
      return [];
  }

}

export function createSelectDateConstraintItems(config: DateTimeConstraintConfig, defaultTitle: string): SelectItemModel[] {
  const options = createDateTimeOptions(config.format);
  const formats = [];
  if (options.year && (options.month || options.day)) {
    formats.push('YYYY');
  }
  if (options.year && options.month && options.day) {
    formats.push(...['MM.YYYY', 'MM', 'DD.MM', 'DD']);
  }
  if (options.year && options.month && options.day && (options.hours || options.minutes)) {
    formats.push('DD.MM.YYYY');
  }

  if (!(options.year || options.month || options.day)) {
    if (options.hours && options.minutes) {
      formats.push('HH');
    }
    if (options.hours && options.minutes && options.seconds) {
      formats.push('HH:mm');
    }
  }

  const defaultItem: SelectItemModel = {id: {format: config.format}, value: defaultTitle};
  return [defaultItem, ...formats.filter(format => format !== config.format)
    .map(format => ({id: format, value: format}))];
}
