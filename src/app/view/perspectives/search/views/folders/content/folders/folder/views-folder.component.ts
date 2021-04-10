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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {calculateObjectFoldersOverallCount, ObjectFolders} from '../../util/object-folders';
import {View} from '../../../../../../../../core/store/views/view';
import {SizeType} from '../../../../../../../../shared/slider/size/size-type';

@Component({
  selector: 'views-folder',
  templateUrl: './views-folder.component.html',
  styleUrls: ['../../../../common/view-detail/view-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewsFolderComponent implements OnChanges {
  @Input()
  public folder: ObjectFolders<View>;

  @Input()
  public viewSize: SizeType;

  @Output()
  public clicked = new EventEmitter();

  public readonly sizeType = SizeType;

  public count: number;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.folder) {
      this.count = calculateObjectFoldersOverallCount(this.folder);
    }
  }

  public onClick() {
    this.clicked.emit();
  }
}
