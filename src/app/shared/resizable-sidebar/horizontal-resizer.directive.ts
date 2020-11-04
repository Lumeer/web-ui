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

import {Directive, HostListener, ElementRef, Renderer2, Output, EventEmitter} from '@angular/core';
import {preventEvent} from '../utils/common.utils';

@Directive({
  selector: '[horizontal-resizer]',
})
export class HorizontalResizerDirective {
  @Output()
  public onResize = new EventEmitter<number>();

  @Output()
  public resizeStart = new EventEmitter();

  @Output()
  public resizeEnd = new EventEmitter();

  private width: number;
  private oldX = 0;
  private resizingElement: HTMLElement;

  constructor(private element: ElementRef, private renderer: Renderer2) {
  }

  @HostListener('document:mousemove', ['$event'])
  private onMouseMove(event: MouseEvent) {
    if (!this.resizingElement) {
      return;
    }

    this.resize(this.oldX - event.clientX);
    this.oldX = event.clientX;
  }

  @HostListener('document:click', ['$event'])
  private onClick(event: MouseEvent) {
    console.log('doc click');
    if (!this.resizingElement) {
      return;
    }

    preventEvent(event);
    this.resizingElement = null;
    this.width = null;
    this.resizeEnd.emit();
  }

  @HostListener('document:mouseup', ['$event'])
  private onMouseUp(event: MouseEvent) {
    console.log('mouse up');
    if (!this.resizingElement) {
      return;
    }

    preventEvent(event);
    if (this.width) {
      this.onResize.emit(this.width);
    }
  }

  private resize(offsetX: number) {
    this.width += offsetX;
    this.renderer.setStyle(this.resizingElement, 'width', `${this.width}px`);
  }

  @HostListener('mousedown', ['$event'])
  private onMouseDown(event: MouseEvent) {
    preventEvent(event);

    this.resizingElement = this.element.nativeElement.parentNode;
    this.width = this.resizingElement?.offsetWidth;
    this.oldX = event.clientX;
    this.resizeStart.emit();
  }
}
