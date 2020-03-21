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

import {Component, ChangeDetectionStrategy, EventEmitter, Output, ViewChild, ElementRef} from '@angular/core';
import {DataRowHiddenComponent} from '../../data/data-row-component';

@Component({
  selector: 'hidden-input',
  templateUrl: './hidden-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiddenInputComponent implements DataRowHiddenComponent {
  @Output()
  public newInput = new EventEmitter<string>();

  @ViewChild('hiddenInput')
  public hiddenInput: ElementRef<HTMLInputElement>;

  private skipCompose = false;

  public focus() {
    this.hiddenInput && this.hiddenInput.nativeElement.focus();
  }

  public blur() {
    this.hiddenInput && this.hiddenInput.nativeElement.blur();
  }

  public onClick(event: MouseEvent) {
    event.preventDefault();
  }

  public onInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    if ((event as any).isComposing && this.skipCompose) {
      this.skipCompose = false;
      return;
    }

    this.skipCompose = false;
    this.newInput.emit(element.value);
    element.value = '';
  }

  public onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Dead') {
      this.skipCompose = true;
      return;
    }
  }
}
