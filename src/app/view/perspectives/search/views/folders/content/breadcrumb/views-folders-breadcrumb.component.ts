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

import {Component, ChangeDetectionStrategy, EventEmitter, Output, Input} from '@angular/core';
import {ObjectFolders} from '../util/object-folders';
import {View} from '../../../../../../../core/store/views/view';

@Component({
  selector: 'views-folders-breadcrumb',
  templateUrl: './views-folders-breadcrumb.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewsFoldersBreadcrumbComponent {
  @Input()
  public viewFolders: ObjectFolders<View>;

  @Input()
  public foldersPath: string[];

  @Output()
  public pathSelected = new EventEmitter<string[]>();

  public onHomeClick() {
    this.pathSelected.emit([]);
  }

  public onPathClick(index: number) {
    const newPath = this.foldersPath.slice(0, index + 1);
    this.pathSelected.emit(newPath);
  }
}
