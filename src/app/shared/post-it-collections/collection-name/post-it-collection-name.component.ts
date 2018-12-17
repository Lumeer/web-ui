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

import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'post-it-collection-name',
  templateUrl: './post-it-collection-name.component.html',
  styleUrls: ['./post-it-collection-name.component.scss'],
})
export class PostItCollectionNameComponent {
  @ViewChild('collectionNameInput') public input: ElementRef;

  @Input() public editable: boolean;
  @Input() public collectionName: string;

  @Output() public changed = new EventEmitter<string>();
  @Output() public selected = new EventEmitter();
  @Output() public unselected = new EventEmitter();

  public onNameBlurred(value: string) {
    this.unselected.emit();

    const trimmed = value.trim();
    if (trimmed === '') {
      this.input.nativeElement.textContent = this.collectionName;
    } else if (trimmed !== this.collectionName) {
      this.changed.emit(trimmed);
    }
  }

  public onNameSelected() {
    this.selected.emit();
  }
}
