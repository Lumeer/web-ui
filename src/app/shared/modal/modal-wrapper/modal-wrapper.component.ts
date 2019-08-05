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
import {DialogType} from '../../../dialog/dialog-type';

@Component({
  selector: 'modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  styleUrls: ['./modal-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWrapperComponent {
  @Input()
  public type: DialogType;

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
  public performingAction = false;

  @Output()
  public close = new EventEmitter();

  @Output()
  public submit = new EventEmitter();

  public onCloseClick() {
    this.close.next();
  }

  public onSubmitClick() {
    if (!this.submitDisabled) {
      this.submit.emit();
    }
  }
}
