/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
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
