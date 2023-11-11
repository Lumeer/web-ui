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

import {Component, ChangeDetectionStrategy, Output, EventEmitter, Input, SimpleChanges, OnChanges} from '@angular/core';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {Collection, CollectionPurposeType} from '../../../../../../core/store/collections/collection';
import {CreateDocumentModalComponent} from '../../../../../../shared/modal/create-document/create-document-modal.component';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {View} from '../../../../../../core/store/views/view';
import {
  checkSizeType,
  SearchTasksConfig,
  TaskConfigAttribute,
  TasksConfigGroupBy,
  TasksConfigSortBy,
} from '../../../../../../core/store/searches/search';

@Component({
  selector: 'tasks-toolbar',
  templateUrl: './tasks-toolbar.component.html',
  styleUrls: ['./tasks-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksToolbarComponent implements OnChanges {
  @Input()
  public config: SearchTasksConfig;

  @Input()
  public documentsCount: number;

  @Input()
  public collections: Collection[];

  @Input()
  public views: View[];

  @Input()
  public viewId: string;

  @Output()
  public configChange = new EventEmitter<SearchTasksConfig>();

  public currentSize: SizeType;

  constructor(private modalService: ModalService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.currentSize = checkSizeType(this.config?.size);
    }
  }

  public onSortByChange(sortBy: TasksConfigSortBy) {
    this.configChange.next({...this.config, sortBy});
  }

  public onGroupByChange(groupBy: TasksConfigGroupBy) {
    this.configChange.next({...this.config, groupBy});
  }

  public onSizeChange(size: SizeType) {
    this.configChange.next({...this.config, size});
  }

  public onAdd() {
    if (this.collections?.length || this.views?.length) {
      const initialState = {purpose: CollectionPurposeType.Tasks, viewId: this.viewId};
      this.modalService.showStaticDialog(initialState, CreateDocumentModalComponent, 'modal-lg modal-h-100');
    }
  }
}
