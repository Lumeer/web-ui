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

import {Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {ObjectFolders} from '../util/object-folders';
import {View} from '../../../../../../../core/store/views/view';

@Component({
  selector: 'views-folders-breadcrumb',
  templateUrl: './views-folders-breadcrumb.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewsFoldersBreadcrumbComponent implements OnChanges {
  @Input()
  public viewFolders: ObjectFolders<View>;

  @Input()
  public foldersPath: string[];

  @Output()
  public pathSelected = new EventEmitter<string[]>();

  public path: string[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.viewFolders || changes.foldersPath) {
      this.path = this.checkPath();
    }
  }

  private checkPath(): string[] {
    if (!this.viewFolders || !this.foldersPath) {
      return [];
    }
    const path = [];

    // filter only valid path strings
    let currentViewFolders = this.viewFolders;
    for (const name of this.foldersPath) {
      const viewFoldersByName = currentViewFolders.folders.find(folder => folder.name === name);
      if (viewFoldersByName) {
        currentViewFolders = viewFoldersByName;
        path.push(name);
      } else {
        break;
      }
    }
    return path;
  }

  public onHomeClick() {
    this.pathSelected.emit([]);
  }

  public onPathClick(index: number) {
    const newPath = this.path.slice(0, index + 1);
    this.pathSelected.emit(newPath);
  }
}
