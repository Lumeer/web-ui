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

import {Component, HostListener, Input, OnInit} from '@angular/core';
import {SelectionList} from '../../selection-list';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../core/store/app.state';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';
import {DialogType} from '../../../../modal/dialog-type';
import {minLengthValidator} from '../../../../../core/validators/custom-validators';
import {uniqueValuesValidator} from '../../../../../core/validators/unique-values-validator';
import {SelectConstraintOptionsFormControl} from '../../../../modal/attribute-type/form/constraint-config/select/select-constraint-form-control';
import {minimumValuesCountValidator} from '../../../../../core/validators/mininum-values-count-validator';
import {SelectionListsAction} from '../../../../../core/store/selection-lists/selection-lists.action';
import {generateId} from '../../../../utils/resource.utils';
import {parseSelectOptionsFromForm} from '../../../../modal/attribute-type/form/constraint-config/select/select-constraint.utils';
import {keyboardEventCode, KeyCode} from '../../../../key-code';

@Component({
  selector: 'selection-list-modal',
  templateUrl: './selection-list-modal.component.html',
  styleUrls: ['./selection-list-modal.component.scss'],
})
export class SelectionListModalComponent implements OnInit {
  @Input()
  public list: SelectionList;

  @Input()
  public organizationId: string;

  @Input()
  public projectId: string;

  public readonly dialogType = DialogType.Primary;

  public form: FormGroup;
  public performingAction$ = new BehaviorSubject(false);

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>, private fb: FormBuilder) {}

  public ngOnInit() {
    this.createForm();
  }

  private createForm() {
    this.form = this.fb.group({
      name: [this.list.name, minLengthValidator(1)],
      displayValues: [this.list.displayValues],
      options: this.fb.array(
        [],
        [
          uniqueValuesValidator(SelectConstraintOptionsFormControl.Value, true),
          minimumValuesCountValidator(SelectConstraintOptionsFormControl.Value, 1),
        ]
      ),
    });
  }

  public onSubmit() {
    const displayValues = this.form.controls.displayValues.value;
    const options = parseSelectOptionsFromForm(this.form.controls.options as FormArray, displayValues);
    const list = {
      ...this.list,
      ...this.form.value,
      options,
      organizationId: this.organizationId,
      projectId: this.projectId,
    };
    if (this.list.id) {
      this.store$.dispatch(new SelectionListsAction.Update({list}));
    } else {
      list.id = generateId();
      this.store$.dispatch(new SelectionListsAction.Create({list}));
    }

    this.hideDialog();
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
