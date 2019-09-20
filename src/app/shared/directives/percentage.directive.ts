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

import {Directive, ElementRef, HostListener, Inject, Optional, Renderer2} from '@angular/core';
import {COMPOSITION_BUFFER_MODE, DefaultValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Directive({
  selector: '[percentage]',
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: PercentageDirective, multi: true}],
})
export class PercentageDirective extends DefaultValueAccessor {
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

  @HostListener('input', ['$event'])
  public onInput(event: Event) {
    let displayValue = (<HTMLInputElement>event.currentTarget).value;
    displayValue = displayValue.replace(/[^0-9,.eE\s\%-]/g, '').replace(/-/g, (str, index) => (index > 0 ? '' : str));
    displayValue = displayValue.replace(/\%/g, (str, index) =>
      displayValue.length > 0 && index < displayValue.length - 1 ? '' : str
    );
    this._sourceRenderer.setProperty(this._sourceElementRef.nativeElement, 'value', displayValue);
  }
}
