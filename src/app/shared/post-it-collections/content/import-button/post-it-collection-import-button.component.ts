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

export interface CollectionImportData {
  result: string;
  name: string;
  format: string;
}

@Component({
  selector: 'post-it-collection-import-button',
  templateUrl: './post-it-collection-import-button.component.html',
  styleUrls: ['./post-it-collection-import-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItCollectionImportButtonComponent {
  @Output()
  public import = new EventEmitter<CollectionImportData>();

  @Output()
  public error = new EventEmitter<string>();

  @Input()
  public disabled: boolean;

  public dragging: boolean = false;

  public handleDrop(event) {
    this.dragging = false;
    event.preventDefault();
    this.fileChange(event.dataTransfer.files);
  }

  public fileChange(files: FileList) {
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      const indexOfSuffix = file.name.lastIndexOf('.');
      const name = indexOfSuffix !== -1 ? file.name.substring(0, indexOfSuffix) : file.name;
      reader.onloadend = () => {
        this.import.emit({result: String(reader.result), name, format: 'csv'});
      };
      reader.readAsText(file);
    } else {
      const message = $localize`:@@files.input.button.empty:File input is empty`;
      this.error.emit(message);
    }
  }
}
