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

import {PivotAttribute, PivotConfig} from '../../../../core/store/pivots/pivot';

export function pivotAttributesAreSame(a1: PivotAttribute, a2: PivotAttribute): boolean {
  return (
    a1.resourceId === a2.resourceId &&
    a1.resourceIndex === a2.resourceIndex &&
    a1.attributeId === a2.attributeId &&
    a1.resourceType === a2.resourceType
  );
}

export function pivotConfigHasDataTransformChange(c1: PivotConfig, c2: PivotConfig): boolean {
  if (!c1 && !c2) {
    return false;
  }
  if ((!c1 && c2) || (c1 && !c2)) {
    return true;
  }

  const c1RowAttributes = (c1.rowAttributes || []).map(a => cleanPivotAttribute(a));
  const c2RowAttributes = (c2.rowAttributes || []).map(a => cleanPivotAttribute(a));
  if (JSON.stringify(c1RowAttributes) !== JSON.stringify(c2RowAttributes)) {
    return true;
  }

  const c1ColumnAttributes = (c1.columnAttributes || []).map(a => cleanPivotAttribute(a));
  const c2ColumnAttributes = (c2.columnAttributes || []).map(a => cleanPivotAttribute(a));
  if (JSON.stringify(c1ColumnAttributes) !== JSON.stringify(c2ColumnAttributes)) {
    return true;
  }

  return JSON.stringify(c1.valueAttributes) !== JSON.stringify(c2.valueAttributes);
}

export function cleanPivotAttribute(attribute: PivotAttribute): PivotAttribute {
  return {
    resourceIndex: attribute.resourceIndex,
    attributeId: attribute.attributeId,
    resourceId: attribute.resourceId,
    resourceType: attribute.resourceType,
  };
}

export function pivotConfigHasAdditionalValueLevel(config: PivotConfig): boolean {
  const columnsNum = (config.columnAttributes || []).length;
  const valuesNum = (config.valueAttributes || []).length;
  return (columnsNum === 0 && valuesNum > 0) || (columnsNum > 0 && valuesNum > 1);
}
