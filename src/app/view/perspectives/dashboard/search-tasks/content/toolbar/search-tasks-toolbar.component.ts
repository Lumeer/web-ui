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

import {Component, ChangeDetectionStrategy, Output, EventEmitter, Input} from '@angular/core';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {Collection, CollectionPurposeType} from '../../../../../../core/store/collections/collection';
import {CreateDocumentModalComponent} from '../../../../../../shared/modal/create-document/create-document-modal.component';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {View} from '../../../../../../core/store/views/view';

@Component({
  selector: 'search-tasks-toolbar',
  templateUrl: './search-tasks-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTasksToolbarComponent {
  @Input()
  public size: SizeType;

  @Input()
  public documentsCount: number;

  @Input()
  public collections: Collection[];

  @Input()
  public views: View[];

  @Input()
  public viewId: string;

  @Output()
  public sizeChange = new EventEmitter<SizeType>();

  constructor(private modalService: ModalService) {}

  public onSizeChange(size: SizeType) {
    this.sizeChange.emit(size);
  }

  public onAdd() {
    if (this.collections?.length || this.views?.length) {
      const initialState = {purpose: CollectionPurposeType.Tasks, viewId: this.viewId};
      this.modalService.showStaticDialog(initialState, CreateDocumentModalComponent);
    }
  }
}
