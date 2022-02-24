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

import {Directive, OnChanges, Input, HostBinding, ElementRef, SimpleChanges} from '@angular/core';

@Directive({
  selector: '[smoothSize]',
  host: {'[style.display]': '"block"', '[style.overflow]': '"hidden"'},
})
export class SmoothSizeDirective implements OnChanges {
  @Input()
  public opened: boolean;

  private startHeight: number;
  private startWidth: number;
  private value: string;

  constructor(private element: ElementRef) {}

  @HostBinding('@smoothSize')
  get grow() {
    return {value: this.value, params: {startHeight: this.startHeight, startWidth: this.startWidth}};
  }

  public setStartParams() {
    this.startHeight = this.element.nativeElement.clientHeight;
    this.startWidth = this.element.nativeElement.clientWidth;
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.setStartParams();
    this.value = this.opened ? 'open' : 'closed';
  }
}
