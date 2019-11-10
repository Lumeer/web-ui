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

import {Directive, ElementRef, HostListener, Inject, Input, Optional, Renderer2} from '@angular/core';
import {COMPOSITION_BUFFER_MODE, DefaultValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {isNotNullOrUndefined} from '../utils/common.utils';

@Directive({
  selector: '[integer]',
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: IntegerDirective, multi: true}],
})
export class IntegerDirective extends DefaultValueAccessor {
  @Input()
  public minValue;

  @Input()
  public maxValue;

  private _sourceRenderer: Renderer2;
  private _sourceElementRef: ElementRef;

  constructor(
    @Inject(Renderer2) renderer: Renderer2,
    @Inject(ElementRef) elementRef: ElementRef,
    @Optional() @Inject(COMPOSITION_BUFFER_MODE) compositionMode: boolean
  ) {
    super(renderer, elementRef, compositionMode);

    this._sourceRenderer = renderer;
    this._sourceElementRef = elementRef;
  }

  @HostListener('blur', ['$event.target.value'])
  public onBlur(value) {
    // console.log('blir', value);
  }

  @HostListener('input', ['$event'])
  public onInput(event: Event) {
    const value = (<HTMLInputElement>event.currentTarget).value;
    // console.log(value);
    if (isNotNullOrUndefined(value) && value !== '') {
      const absolute = Math.abs(+value);
      this._sourceRenderer.setProperty(this._sourceElementRef.nativeElement, 'value', String(absolute));
      this.onChange(absolute);
    }
  }
}
