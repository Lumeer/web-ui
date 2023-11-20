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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {AllowedPermissionsMap} from '../../../../../../../core/model/allowed-permissions';
import {Workspace} from '../../../../../../../core/store/navigation/workspace';
import {View} from '../../../../../../../core/store/views/view';
import {SizeType} from '../../../../../../../shared/slider/size/size-type';
import {QueryData} from '../../../../../../../shared/top-panel/search-box/util/query-data';
import {ObjectFolders} from '../util/object-folders';

@Component({
  selector: 'views-folders',
  templateUrl: './views-folders.component.html',
  styleUrls: ['./views-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewsFoldersComponent {
  @Input()
  public viewFolders: ObjectFolders<View>;

  @Input()
  public queryData: QueryData;

  @Input()
  public viewSize: SizeType;

  @Input()
  public permissions: AllowedPermissionsMap;

  @Input()
  public workspace: Workspace;

  @Output()
  public favoriteToggle = new EventEmitter<View>();

  @Output()
  public folderClick = new EventEmitter<string>();

  @Output()
  public viewFolderAdded = new EventEmitter<{view: View; folder: string}>();

  public readonly sizeType = SizeType;

  public draggedFolderSubject$ = new BehaviorSubject(null);
  public draggedFolder$ = this.draggedFolderSubject$.pipe(distinctUntilChanged());
  public dragging$ = new BehaviorSubject(false);

  private draggingView: View;

  public trackByView(index: number, view: View): string {
    return view.id;
  }

  public trackByFolder(index: number, folder: ObjectFolders<View>): string {
    return folder.name;
  }

  public onDragStart(view: View) {
    this.draggingView = view;
    this.dragging$.next(true);
    this.resetDraggedFolder();
  }

  public onDragEnd() {
    this.draggingView = null;
    this.dragging$.next(false);
    this.resetDraggedFolder();
  }

  public onDrop(name: string) {
    if (this.draggingView) {
      this.viewFolderAdded.emit({view: this.draggingView, folder: name});
      this.onDragEnd();
    }
  }

  public onDragEnter(folder: string) {
    this.draggedFolderSubject$.next(folder);
  }

  public onDragLeave(folder: string) {
    if (this.draggedFolderSubject$.value === folder) {
      this.resetDraggedFolder();
    }
  }

  public resetDraggedFolder() {
    this.draggedFolderSubject$.next(null);
  }
}
