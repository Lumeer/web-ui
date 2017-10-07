/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Type} from '@angular/core';
import {PerspectiveChoice} from './perspective-choice';
import {PostItPerspectiveComponent} from './post-it/post-it-perspective.component';
import {TablePerspectiveComponent} from './table/table-perspective.component';
import {SearchPerspectiveComponent} from './search/search-perspective.component';

export class Perspective implements PerspectiveChoice {

  public static PostIt = new Perspective('postit', 'Post-it', PostItPerspectiveComponent);
  public static Search = new Perspective('search', 'Search', SearchPerspectiveComponent);
  public static Table = new Perspective('table', 'Table', TablePerspectiveComponent);

  private constructor(public id: string,
                      public name: string,
                      public component: Type<any>) {
  }

}

export const PERSPECTIVES = {
  [Perspective.PostIt.id]: Perspective.PostIt,
  [Perspective.Search.id]: Perspective.Search,
  [Perspective.Table.id]: Perspective.Table
};
