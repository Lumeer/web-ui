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
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentHintColumn} from '../../../../shared/document-hints/document-hint-column';
import {filterVisibleAttributesBySettings} from '../../../../shared/utils/attribute.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {AttributesSettings} from '../../../../core/store/view-settings/view-settings';

const defaultColumnWidth = 100;

@Pipe({
  name: 'collectionHintColumns',
})
export class CollectionHintColumnsPipe implements PipeTransform {
  public transform(
    collection: Collection,
    settings: AttributesSettings,
    attributeId: string,
    params: {left: number; width: number; parentWidth: number}
  ): DocumentHintColumn[] {
    const visibleAttributes = filterVisibleAttributesBySettings(collection, settings?.collections);
    const attributeIndex = visibleAttributes.findIndex(attribute => attribute.id === attributeId);
    if (attributeIndex >= 0) {
      visibleAttributes.splice(attributeIndex, 1);
    }

    const attribute = findAttribute(collection?.attributes, attributeId);
    if (visibleAttributes.length === 0) {
      return [{width: params.parentWidth, attributeId: attribute.id}];
    }

    const {columnWidth, mainColumnWidth} = this.computeColumnOptimalWidth(visibleAttributes.length, params);

    const offsetIndex = Math.floor(params.left / columnWidth);
    visibleAttributes.splice(offsetIndex, 0, attribute);

    return visibleAttributes.map(attribute => ({
      attributeId: attribute.id,
      width: attribute.id === attributeId ? mainColumnWidth : columnWidth,
    }));
  }

  private computeColumnOptimalWidth(
    columnsCount: number,
    params: {left: number; width: number; parentWidth: number}
  ): {columnWidth: number; mainColumnWidth: number} {
    let columnWidth = defaultColumnWidth;
    let mainColumnWidth = 2 * defaultColumnWidth;

    while (columnWidth * columnsCount + mainColumnWidth < params.parentWidth) {
      columnWidth += 1;
      mainColumnWidth += 3;
    }

    return {columnWidth, mainColumnWidth};
  }
}
