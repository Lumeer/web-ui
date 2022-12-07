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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ModalService} from '../../../shared/modal/modal.service';
import {Collection} from '../../../core/store/collections/collection';

@Component({
  selector: 'collection-upload',
  templateUrl: './collection-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionUploadComponent {
  @Input()
  public collection: Collection;

  public uploading$ = new BehaviorSubject(false);

  constructor(private modalService: ModalService) {}

  public onFileChange($event: Event) {
    if (this.uploading$.value) {
      return;
    }

    const files: FileList = $event.target['files'];

    if (files.length !== 1) {
      return;
    }

    const file = files.item(0);
    const reader = new FileReader();
    reader.onloadend = () => {
      this.onImport(String(reader.result));
    };
    reader.readAsText(file);
  }

  private onImport(result: string) {
    this.modalService.showImportCollection(this.collection.id, result);
  }
}
