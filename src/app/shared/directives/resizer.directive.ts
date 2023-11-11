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

import {Directive, HostListener, ElementRef, Renderer2, Input, Output, EventEmitter} from '@angular/core';

@Directive({
  selector: '[resizer]',
})
export class ResizerDirective {
  @Input()
  public tagName: string = 'div';

  @Input()
  public reference: string;

  @Input()
  public minHeight: number;

  @Input()
  public maxHeight: number;

  @Output()
  public onResize = new EventEmitter<number>();

  private height: number;
  private initialHeight: number;
  private oldY = 0;
  private resizingElement: HTMLElement;

  constructor(
    private element: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('document:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    if (!this.resizingElement) {
      return;
    }

    this.resize(event.clientY - this.oldY);
    this.oldY = event.clientY;
  }

  @HostListener('touchmove', ['$event'])
  public onTouchMove(event: TouchEvent) {
    if (!this.resizingElement) {
      return;
    }

    if (event.touches?.length) {
      const clientY = event.touches.item(0).clientY;
      this.resize(clientY - this.oldY);
      this.oldY = clientY;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  public onMouseUp(event: MouseEvent) {
    if (this.height && this.height !== this.initialHeight) {
      this.onResize.emit(this.height);
    }
    this.resizingElement = null;
    this.height = null;
    this.initialHeight = null;
  }

  @HostListener('touchend', ['$event'])
  public onTouchEnd(event: TouchEvent) {
    if (this.height && this.height !== this.initialHeight) {
      this.onResize.emit(this.height);
    }
    this.resizingElement = null;
    this.height = null;
    this.initialHeight = null;
  }

  private resize(offsetY: number) {
    this.height += offsetY;
    if (this.minHeight) {
      this.height = Math.max(this.height, this.minHeight);
    }
    if (this.maxHeight) {
      this.height = Math.min(this.height, this.maxHeight);
    }
    this.renderer.setStyle(this.resizingElement, 'height', `${this.height}px`);
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    event.preventDefault();

    this.resizingElement = this.findResizingElement();
    this.height = this.resizingElement?.offsetHeight;
    this.initialHeight = this.height;
    this.oldY = event.clientY;
  }

  @HostListener('touchstart', ['$event'])
  public onTouchStart(event: TouchEvent) {
    event.preventDefault();

    if (event.touches?.length) {
      this.resizingElement = this.findResizingElement();
      this.height = this.resizingElement?.offsetHeight;
      this.initialHeight = this.height;
      this.oldY = event.touches.item(0).clientY;
    }
  }

  private findResizingElement(): HTMLElement {
    const elementsByTag: HTMLCollectionOf<any> = this.element.nativeElement?.parentElement?.getElementsByTagName(
      this.tagName?.toUpperCase()
    );
    for (let i = 0; i < elementsByTag?.length; i++) {
      if (elementsByTag.item(i).id === this.reference) {
        return elementsByTag.item(i);
      }
    }

    return document.getElementById(this.reference);
  }
}
