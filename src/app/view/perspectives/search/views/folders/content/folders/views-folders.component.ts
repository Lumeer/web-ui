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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {ObjectFolders} from '../util/object-folders';
import {View} from '../../../../../../../core/store/views/view';
import {QueryData} from '../../../../../../../shared/top-panel/search-box/util/query-data';
import {SizeType} from '../../../../../../../shared/slider/size/size-type';
import {AllowedPermissions} from '../../../../../../../core/model/allowed-permissions';

@Component({
  selector: 'views-folders',
  templateUrl: './views-folders.component.html',
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
  public permissions: Record<string, AllowedPermissions>;

  @Output()
  public viewClick = new EventEmitter<View>();

  @Output()
  public folderClick = new EventEmitter<string>();

  public trackByView(index: number, view: View): string {
    return view.id;
  }

  public trackByFolder(index: number, folder: ObjectFolders<View>): string {
    return folder.name;
  }
}
