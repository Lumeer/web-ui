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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {FormButtonConfig, FormButtonsConfig} from '../../../../../../core/store/form/form-model';
import {FormValidation} from '../validation/form-validation';

@Component({
  selector: 'form-view-submit',
  templateUrl: './form-view-submit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./form-view-submit.component.scss'],
  host: {class: 'd-block'},
})
export class FormViewSubmitComponent implements OnChanges {
  @Input()
  public buttons: FormButtonsConfig;

  @Input()
  public document: DocumentModel;

  @Input()
  public loading: boolean;

  @Input()
  public deleting: boolean;

  @Input()
  public validation: FormValidation;

  @Input()
  public deletable: boolean;

  @Input()
  public editable: boolean;

  @Output()
  public submit = new EventEmitter();

  @Output()
  public delete = new EventEmitter();

  public button: FormButtonConfig;
  public valid: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document || changes.buttons) {
      this.findButton();
    }
    if (changes.validation) {
      this.valid = (this.validation?.errors || []).length === 0;
    }
  }

  private findButton() {
    if (this.document?.id) {
      this.button = this.buttons?.update;
    } else {
      this.button = this.buttons?.create;
    }
  }

  public onDelete() {
    if (this.deleting || this.loading) {
      return;
    }
    this.delete.emit();
  }

  public onSubmit() {
    if (this.deleting || this.loading || !this.valid || !this.editable) {
      return;
    }
    this.submit.emit();
  }
}
