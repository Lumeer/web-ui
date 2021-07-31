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

@Directive({
  selector: 'input[trim], textarea[trim], div[trim]',
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: TrimValueAccessorDirective, multi: true}],
})
export class TrimValueAccessorDirective extends DefaultValueAccessor {
  private readonly regex = /\s/g;

  private _type: string = 'text';

  private _value: string;

  private _sourceRenderer: Renderer2;
  private _sourceElementRef: ElementRef;

  @Input() public trim: string;

  @Input()
  get type(): string {
    return this._type;
  }

  set type(value: string) {
    this._type = value || 'text';
  }

  get value() {
    return this._value;
  }

  set value(val: any) {
    this.writeValue(val);

    if (val !== this.value) {
      // Cache the new value first
      this._value = val;

      // update model
      this.onChange(val);
    }
  }

  @HostListener('blur', ['$event.type', '$event.target.value'])
  public onBlur(event: string, value: string): void {
    if (value.replace(this.regex, '') !== this.value) {
      this.updateValue(event, value);
    }

    this.onTouched();
  }

  @HostListener('input', ['$event.type', '$event.target.value'])
  public onInput(event: string, value: string): void {
    this.updateValue(event, value);
  }

  constructor(
    @Inject(Renderer2) renderer: Renderer2,
    @Inject(ElementRef) elementRef: ElementRef,
    @Optional() @Inject(COMPOSITION_BUFFER_MODE) compositionMode: boolean
  ) {
    super(renderer, elementRef, compositionMode);

    this._sourceRenderer = renderer;
    this._sourceElementRef = elementRef;
  }

  public writeValue(value: any): void {
    if (!this._value) {
      this._value = value;
    }

    this._sourceRenderer.setProperty(this._sourceElementRef.nativeElement, 'value', value);

    if (this._type !== 'text') {
      this._sourceRenderer.setAttribute(this._sourceElementRef.nativeElement, 'value', value);
    }
  }

  private updateValue(event: string, value: string): void {
    this.value = this.trim !== '' && event !== this.trim ? value : value.replace(this.regex, '');
    this.onChange(this.value);
  }
}
