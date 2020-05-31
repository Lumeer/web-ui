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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {DialogType} from '../dialog-type';
import {PlatformLocation} from '@angular/common';
import {BsModalRef} from 'ngx-bootstrap/modal';

@Component({
  selector: 'modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  styleUrls: ['./modal-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWrapperComponent {
  @Input()
  public dialogType: DialogType;

  @Input()
  public icon: string;

  @Input()
  public showSubmit = true;

  @Input()
  public showClose = true;

  @Input()
  public showHeader = true;

  @Input()
  public showFooter = true;

  @Input()
  public submitDisabled = false;

  @Input()
  public closeDisabled = false;

  @Input()
  public performingAction = false;

  @Input()
  public customHeader: boolean;

  @Output()
  public onClose = new EventEmitter();

  @Output()
  public onSubmit = new EventEmitter();

  constructor(private location: PlatformLocation, private ref: BsModalRef) {
    location.onPopState(() => {
      this.ref.hide();
    });
  }

  public onCloseClick() {
    this.onClose.next();
  }

  public onSubmitClick() {
    if (!this.submitDisabled) {
      this.onSubmit.emit();
    }
  }
}
