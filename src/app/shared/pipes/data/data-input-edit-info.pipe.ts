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

import {Pipe, PipeTransform} from '@angular/core';
import {Attribute} from '../../../core/store/collections/collection';
import {DataValue} from '../../../core/model/data-value';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ActionConstraintConfig} from '../../../core/model/data/constraint-config';
import {dataMeetsFilters} from '../../../core/store/documents/documents.filters';
import {hasRoleByPermissions} from '../../utils/resource.utils';
import {isNotNullOrUndefined} from '../../utils/common.utils';

@Pipe({
  name: 'dataInputEditInfo',
})
export class DataInputEditInfoPipe implements PipeTransform {
  public transform(
    attribute: Attribute,
    dataValue: DataValue,
    data: Record<string, any>,
    attributes: Attribute[],
    permissions: AllowedPermissions,
    editing: boolean,
    constraintData: ConstraintData,
    editable?: boolean
  ): {readonly: boolean; hasValue: boolean; showDataInput: boolean; additionalMargin: boolean; editing: boolean} {
    const constraint = attribute?.constraint || new UnknownConstraint();
    const asText = constraint.isTextRepresentation;
    const hasValue = dataValue && !!dataValue.format();
    const isEditable = isNotNullOrUndefined(editable) ? editable : permissions?.writeWithView;
    let isReadonly;
    if (constraint.type === ConstraintType.Action) {
      const config = <ActionConstraintConfig>constraint.config;
      const filters = config.equation?.equations?.map(eq => eq.filter) || [];
      isReadonly =
        !dataMeetsFilters(data, attributes, filters, constraintData, config.equation?.operator) ||
        !hasRoleByPermissions(config.role, permissions);
    } else {
      isReadonly = !isEditable || !editing;
    }

    const forceDataInput = [ConstraintType.Action, ConstraintType.Files].includes(constraint.type);
    return {
      readonly: isReadonly,
      hasValue,
      showDataInput: forceDataInput || !isReadonly || (!asText && hasValue),
      additionalMargin: constraint.type === ConstraintType.Select,
      editing,
    };
  }
}
