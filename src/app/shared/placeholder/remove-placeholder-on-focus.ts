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

import {Directive, HostBinding, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[remove-placeholder-on-focus]',
})
export class RemovePlaceholderOnFocusDirective {
  @HostListener('blur')
  public onBlur() {
    this.focused = false;
  }

  @HostListener('focus')
  public onFocus() {
    this.focused = true;
  }

  @Input()
  @HostBinding('attr.placeholder')
  public get placeholder() {
    if (this.focused) {
      return '';
    } else {
      return this.placeholderText;
    }
  }

  public set placeholder(value: string) {
    if (value) {
      this.placeholderText = value;
    }
  }

  private focused = false;

  private placeholderText = '';
}
