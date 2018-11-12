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

import {SizeType} from '../../../../shared/slider/size-type';

@Pipe({
  name: 'postItColumnStyle',
})
export class PostItColumnStylePipe implements PipeTransform {
  public transform(size: SizeType): string {
    switch (size) {
      case SizeType.S:
        return 'col-2';
      case SizeType.M:
        return 'col-3';
      case SizeType.L:
        return 'col-4';
      case SizeType.XL:
        return 'col-6';
      default:
        return 'col-3';
    }
  }
}
