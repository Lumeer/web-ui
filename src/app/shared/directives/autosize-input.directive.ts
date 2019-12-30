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

import {AfterViewChecked, AfterViewInit, Directive, ElementRef, HostListener, Input, Renderer2} from '@angular/core';

@Directive({
  selector: '[autoSizeInput]',
})
export class AutoSizeInputDirective implements AfterViewInit, AfterViewChecked {
  @Input()
  public minWidth = 10;

  private context: CanvasRenderingContext2D;

  constructor(private element: ElementRef, private renderer: Renderer2) {}

  private get borderWidth(): number {
    return 2 * this.getPropertyWidth('border');
  }

  private get paddingWidth(): number {
    return this.getPropertyWidth('padding-left') + this.getPropertyWidth('padding-right');
  }

  private getPropertyWidth(property: string): number {
    const width = window.getComputedStyle(this.element.nativeElement, '').getPropertyValue(property);
    return parseInt(width, 10);
  }

  public ngAfterViewChecked() {
    this.updateWidth();
  }

  public ngAfterViewInit() {
    this.updateWidth();
  }

  @HostListener('input')
  public onInput() {
    this.updateWidth();
  }

  private updateWidth() {
    const width = this.computeWidth();
    this.renderer.setStyle(this.element.nativeElement, 'width', `${width}px`);
  }

  private computeWidth() {
    const value = this.element.nativeElement.value || '';
    const placeholder = this.element.nativeElement.placeholder || '';
    const computingValue = value.length > placeholder.length ? value : placeholder;

    const width = Math.max(Math.ceil(this.getContext().measureText(computingValue).width), this.minWidth || 0);
    return width + this.borderWidth + this.paddingWidth + 1; // for cursor
  }

  private getContext(): CanvasRenderingContext2D {
    if (!this.context) {
      this.context = this.renderer.createElement('canvas').getContext('2d');

      const style = window.getComputedStyle(this.element.nativeElement, 'placeholder');

      const fontStyle = style.getPropertyValue('font-style');
      const fontVariant = style.getPropertyValue('font-variant');
      const fontWeight = style.getPropertyValue('font-weight');
      const fontSize = style.getPropertyValue('font-size');
      const fontFamily = style.getPropertyValue('font-family');

      // font string format: {normal, normal, 700, 20px, Roboto, "Helvetica Neue", sans-serif}
      this.context.font = `${fontStyle}  ${fontVariant} ${fontWeight} ${fontSize} ${fontFamily}`;
    }

    return this.context;
  }
}
