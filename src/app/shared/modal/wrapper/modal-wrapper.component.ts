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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  HostListener,
  ElementRef,
  SimpleChanges,
} from '@angular/core';
import {DialogType} from '../dialog-type';
import {PlatformLocation} from '@angular/common';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {ModalProgress} from './model/modal-progress';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  styleUrls: ['./modal-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWrapperComponent implements OnChanges {
  @Input()
  public dialogType: DialogType;

  @Input()
  public icon: string;

  @Input()
  public showSubmit = true;

  @Input()
  public showSecondarySubmit: boolean;

  @Input()
  public showClose = true;

  @Input()
  public showHeader = true;

  @Input()
  public showFooter = true;

  @Input()
  public submitDisabled: boolean;

  @Input()
  public secondarySubmitDisabled: boolean;

  @Input()
  public secondarySubmitClass: string;

  @Input()
  public secondaryBorderless: boolean;

  @Input()
  public closeDisabled: boolean;

  @Input()
  public secondaryInfo: string;

  @Input()
  public performingAction: boolean;

  @Input()
  public performingSecondaryAction: boolean;

  @Input()
  public customHeader: boolean;

  @Input()
  public allowBodyOverflow: boolean;

  @Input()
  public progress: ModalProgress;

  @Output()
  public onClose = new EventEmitter();

  @Output()
  public onSubmit = new EventEmitter();

  @Output()
  public onSecondarySubmit = new EventEmitter();

  public width$: Observable<number>;

  public elementWidth$ = new BehaviorSubject(0);

  constructor(private location: PlatformLocation, private ref: BsModalRef, public element: ElementRef) {
    location.onPopState(() => {
      this.ref.hide();
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.progress && this.progress) {
      this.checkNewSizeAfterDelay();
      this.width$ = this.elementWidth$.pipe(
        map(width => {
          return width * (this.progress.value / this.progress.max);
        })
      );
    }
  }

  public onCloseClick() {
    this.onClose.next(null);
  }

  public onSubmitClick() {
    if (!this.submitDisabled) {
      this.onSubmit.emit();
    }
  }

  public onSecondarySubmitClick() {
    if (!this.secondarySubmitDisabled) {
      this.onSecondarySubmit.emit();
    }
  }

  public ngAfterViewInit() {
    this.checkNewSizeAfterDelay();
  }

  private checkNewSizeAfterDelay() {
    setTimeout(() => this.checkNewSize());
  }

  private checkNewSize() {
    this.elementWidth$.next(this.element.nativeElement.offsetWidth);
  }

  @HostListener('window:resize')
  public onResize() {
    this.checkNewSize();
  }
}
