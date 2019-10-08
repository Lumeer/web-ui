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

import {Constraint} from '../../../core/model/constraint';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../core/model/data/constraint';
import {FileTypeIconPipe} from '../../data-input/files/file-type-icon.pipe';
import {generateId} from '../resource.utils';

export function createDataValueHtml(
  value: any,
  constraint: Constraint,
  constraintData: ConstraintData,
  className?: string
): string {
  const formattedValue = (constraint || new UnknownConstraint()).createDataValue(value, constraintData).format();

  switch (constraint && constraint.type) {
    case ConstraintType.Color:
      return createDataColorValueHtml(formattedValue, className);
    case ConstraintType.Boolean:
      return createDataBooleanValueHtml(formattedValue, className);
    case ConstraintType.Files:
      return createDataFilesValueHtml(formattedValue, className);
    default:
      return createDataAnyValueHtml(formattedValue, className);
  }
}

function createDataAnyValueHtml(value: string, className?: string) {
  return `<span class="${className || ''}">${value}</span>`;
}

function createDataColorValueHtml(value: string, className?: string) {
  return `<div class="d-inline-block ${className || ''}"
          style="width: 60px; background: ${value}">&nbsp;</div>`;
}

function createDataBooleanValueHtml(value: string, className?: string) {
  const inputId = `search-document-input-${generateId()}`;
  return `<div class="d-inline-block custom-control custom-checkbox ${className || ''}"><input 
             id="${inputId}"
             checked="${value}"
             style="cursor: unset;"
             readonly type="checkbox"
             class="custom-control-input">
          <label
             for="${inputId}"
             style="cursor: unset;"
             class="custom-control-label">
          </label></div>`;
}

function createDataFilesValueHtml(value: string, className?: string) {
  let result = `<span class="${className || ''}">`;

  if (value) {
    const fileTypeIconPipe = new FileTypeIconPipe();

    value
      .split(',')
      .map(s => s.trim())
      .forEach(file => {
        result += `<i title="${file}" class="far fa-fw ${fileTypeIconPipe.transform(file)}"></i>`;
      });
  }

  result += `</span>`;

  return result;
}
