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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {DialogType} from '../../dialog-type';

@Component({
  selector: 'dialog-wrapper',
  templateUrl: './dialog-wrapper.component.html',
  styleUrls: ['./dialog-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogWrapperComponent implements AfterViewInit {
  @ViewChild('modalHeader', {static: true})
  public headerElement: ElementRef;

  @ViewChild('modalFooter', {static: true})
  public footerElement: ElementRef;

  @ViewChild('modalBody', {static: true})
  public bodyElement: ElementRef;

  @Input()
  public submitDisabled: boolean;

  @Input()
  public showSubmit: boolean = true;

  @Input()
  public type: DialogType;

  @Input()
  @HostBinding('style.max-width.px')
  public width: number;

  @Input()
  public fitToScreen = false;

  @Input()
  public performingAction = false;

  @Output()
  public submit = new EventEmitter();

  constructor(private renderer: Renderer2) {}

  public onSubmit() {
    if (!this.submitDisabled) {
      this.submit.emit();
    }
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.recomputeBodyHeightIfNeeded();
  }

  public ngAfterViewInit() {
    this.recomputeBodyHeightIfNeeded();
  }

  public recomputeBodyHeightIfNeeded() {
    if (!this.fitToScreen) {
      return;
    }

    setTimeout(() => this.recomputeBodyHeight());
  }

  private recomputeBodyHeight() {
    const large = window.matchMedia('(min-width: 992px)').matches;

    if (large) {
      const headerHeight = this.headerElement.nativeElement.offsetHeight;
      const footerHeight = this.footerElement.nativeElement.offsetHeight;

      this.renderer.setStyle(
        this.bodyElement.nativeElement,
        'max-height',
        `calc(100% - ${headerHeight + footerHeight}px)`
      );
    } else {
      this.renderer.setStyle(this.bodyElement.nativeElement, 'max-height', null);
    }
  }
}
