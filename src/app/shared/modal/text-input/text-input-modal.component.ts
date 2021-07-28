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
import {Component, HostListener, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {KeyCode} from '../../key-code';
import {Subject} from 'rxjs';
import {DialogType} from '../dialog-type';

@Component({
  selector: 'text-input-modal',
  templateUrl: './text-input-modal.component.html',
})
export class TextInputModalComponent {
  public onSave$ = new Subject<string>();
  public onCancel$ = new Subject();
  public validationFunction: (content: string) => boolean;
  public title = '';
  public description = '';
  public placeholder = '';
  public content = '';
  public valid = false;

  public readonly dialogType = DialogType;

  constructor(private bsModalRef: BsModalRef) {}

  public submitDialog() {
    this.onSave$.next(this.content);
    this.hideDialog();
  }

  public cancelDialog() {
    this.onCancel$.next();
    this.hideDialog();
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape) {
      this.hideDialog();
    }
  }

  public validate($event: any) {
    if (this.validationFunction) {
      this.valid = this.validationFunction($event);
    }
  }
}
