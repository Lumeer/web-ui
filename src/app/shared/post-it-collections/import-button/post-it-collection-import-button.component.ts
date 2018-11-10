/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'post-it-collection-import-button',
  templateUrl: './post-it-collection-import-button.component.html',
  styleUrls: ['./post-it-collection-import-button.component.scss'],
})
export class PostItCollectionImportButtonComponent {
  @Output()
  public import = new EventEmitter<{result: string; name: string; format: string}>();

  @Output()
  public error = new EventEmitter<string>();

  @Input()
  public disabled: boolean;

  constructor(private i18n: I18n) {}

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
        this.import.emit({result: reader.result, name, format: 'csv'});
      };
      reader.readAsText(file);
    } else {
      const message = this.i18n({id: '@@files.input.button.empty', value: 'File input is empty'});
      this.error.emit(message);
    }
  }
}
