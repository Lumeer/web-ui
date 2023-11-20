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

import {Perspective} from '../../view/perspectives/perspective';
import {PerspectiveNamePipe} from './perspective-name.pipe';

@Pipe({
  name: 'sortPerspectives',
})
export class SortPerspectivesPipe implements PipeTransform {
  public constructor(private perspectiveNamePipe: PerspectiveNamePipe) {}

  public transform(perspectives: Perspective[]): {perspective: Perspective; name: string}[] {
    const allPerspectives = perspectives.map(perspective => {
      return {perspective, name: this.perspectiveNamePipe.transform(perspective)};
    });

    const result: {perspective: Perspective; name: string}[] = [];
    const searchIndex = allPerspectives.findIndex(perspective => perspective.perspective === Perspective.Search);
    if (searchIndex >= 0) {
      result.push(allPerspectives[searchIndex]);
      allPerspectives.splice(searchIndex, 1);
    }

    const tableIndex = allPerspectives.findIndex(perspective => perspective.perspective === Perspective.Table);
    if (tableIndex >= 0) {
      result.push(allPerspectives[tableIndex]);
      allPerspectives.splice(tableIndex, 1);
    }

    return result.concat(allPerspectives.sort((a, b) => a.name.localeCompare(b.name)));
  }
}
