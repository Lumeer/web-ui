/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {shadeColor, stripedBackground} from '../../../../../shared/utils/html-modifier';

export const DEFAULT_COLOR = '#ffffff';
export const DEFAULT_STRIPED_COLOR = '#eeeeee';

@Pipe({
  name: 'columnBackground'
})
export class ColumnBackgroundPipe implements PipeTransform {

  public transform(collection: CollectionModel, unsaved?: boolean): any {
    const color = collection ? shadeColor(collection.color, .5) : DEFAULT_COLOR;
    const stripeColor = collection ? shadeColor(color, .25) : DEFAULT_STRIPED_COLOR;

    if (unsaved) {
      return stripedBackground(color, stripeColor);
    }

    return color;
  }

}
