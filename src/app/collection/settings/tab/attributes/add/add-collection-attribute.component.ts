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
  EventEmitter,
  Output,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Attribute} from '../../../../../core/store/collections/collection';
import {AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {KeyCode} from '../../../../../shared/key-code';
import {filterOutInvalidAttributeNameCharacters} from '../../../../../shared/utils/attribute.utils';
import {notEmptyValidator} from '../../../../../core/validators/custom-validators';

@Component({
  selector: 'add-collection-attribute',
  templateUrl: './add-collection-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'card'},
})
export class AddCollectionAttributeComponent implements OnInit, OnChanges {
  @Input()
  public attributes: Attribute[];

  @Output()
  public save = new EventEmitter<string>();

  public form: FormGroup;

  constructor(private fb: FormBuilder) {}

  public get attributeControl(): AbstractControl {
    return this.form?.controls?.attribute;
  }

  public ngOnInit() {
    this.form = this.fb.group({attribute: null});
    this.refreshValidators();
  }

  private refreshValidators() {
    this.attributeControl?.setValidators([notEmptyValidator(), uniqueAttributeValidator(this.attributes)]);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributes && this.attributes) {
      this.refreshValidators();
    }
  }

  public onCreateAttribute() {
    const name = String(this.attributeControl.value || '').trim();
    if (name) {
      this.save.emit(name);
    }
    this.attributeControl?.setValue('');
  }

  public onKeyPress(event: KeyboardEvent) {
    if (event.key === KeyCode.Enter && this.attributeControl?.valid) {
      this.onCreateAttribute();
    }
  }

  public onInput(value: any) {
    const safeValue = filterOutInvalidAttributeNameCharacters(String(value || ''));
    if (safeValue !== value) {
      this.attributeControl?.setValue(safeValue);
    }
  }
}

function uniqueAttributeValidator(attributes: Attribute[]): ValidatorFn {
  return (control: FormControl): ValidationErrors | null => {
    const attributeName = String(control.value || '').trim();
    if (attributes.find(attribute => attribute.name === attributeName)) {
      return {notUnique: true};
    }

    return null;
  };
}
