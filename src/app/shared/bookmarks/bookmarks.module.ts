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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {PipesModule} from '../pipes/pipes.module';
import {BookmarkToolbarComponent} from './bookmark-toolbar/bookmark-toolbar.component';
import {BookmarkComponent} from './bookmark/bookmark.component';
import {QueryItemsPipe} from './views-bookmarks/query-items.pipe';
import {ViewsBookmarksComponent} from './views-bookmarks/views-bookmarks.component';

@NgModule({
  declarations: [BookmarkComponent, BookmarkToolbarComponent, ViewsBookmarksComponent, QueryItemsPipe],
  exports: [BookmarkToolbarComponent, BookmarkComponent, ViewsBookmarksComponent],
  imports: [CommonModule, PipesModule],
})
export class BookmarksModule {}
