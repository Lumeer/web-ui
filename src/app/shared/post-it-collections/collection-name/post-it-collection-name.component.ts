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

import {Component, ElementRef, EventEmitter, Input, Output, SimpleChange, ViewChild} from '@angular/core';

import {FormControl} from '@angular/forms';

@Component({
  selector: 'post-it-collection-name',
  templateUrl: './post-it-collection-name.component.html',
  styleUrls: ['./post-it-collection-name.component.scss'],
})
export class PostItCollectionNameComponent {
  @ViewChild('collectionNameInput') public input: ElementRef;

  @Input() public editable: boolean;
  @Input() public collectionName: string;
  @Input() public nameFormControl: FormControl;

  @Output() public changed = new EventEmitter<string>();
  @Output() public selected = new EventEmitter();
  @Output() public unselected = new EventEmitter();

  private pendingUpdate = false;

  public onNameBlurred(value: string) {
    this.unselected.emit();

    this.pendingUpdate = false;

    const trimmed = value.trim();
    if (trimmed === '') {
      this.input.nativeElement.textContent = this.collectionName;
    } else if (trimmed !== this.collectionName) {
      if (this.nameFormControl && this.nameFormControl.valid) {
        this.changed.emit(trimmed);
      } else {
        this.pendingUpdate = true;
      }
    }
  }

  public onInput(value: string) {
    this.nameFormControl && this.nameFormControl.setValue(value);
  }

  public onNameSelected() {
    this.selected.emit();
  }

  public getPendingUpdate(): string {
    if (!this.shouldPerformPendingUpdate()) {
      return null;
    }
    return this.input.nativeElement.textContent;
  }

  public performPendingUpdateIfNeeded(): boolean {
    if (!this.shouldPerformPendingUpdate()) {
      return false;
    }
    this.pendingUpdate = false;

    const currentValue = this.input.nativeElement.textContent;
    if (currentValue !== this.collectionName) {
      this.changed.emit(currentValue);
      return true;
    }
    return false;
  }

  private shouldPerformPendingUpdate(): boolean {
    const currentValue = this.input.nativeElement.textContent;
    return this.pendingUpdate && this.nameFormControl.valid && currentValue !== this.collectionName;
  }
}
