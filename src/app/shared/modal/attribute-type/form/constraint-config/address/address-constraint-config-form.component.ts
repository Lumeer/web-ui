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

import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {AddressConstraintFormControl} from './address-constraint-form-control';
import {addressDefaultFields, addressExample} from './address-constraint.constants';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {objectValues} from '../../../../../utils/common.utils';
import {AddressConstraintConfig, AddressDataValue, AddressesMap, AddressField} from '@lumeer/data-filters';
import {ConfigurationService} from '../../../../../../configuration/configuration.service';

@Component({
  selector: 'address-constraint-config-form',
  templateUrl: './address-constraint-config-form.component.html',
  styleUrls: ['./address-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressConstraintConfigFormComponent implements OnChanges {
  public readonly controls = AddressConstraintFormControl;
  public readonly fields = objectValues(AddressField);

  private readonly exampleAddressesMap: AddressesMap;

  @Input()
  public config: AddressConstraintConfig;

  @Input()
  public form: FormGroup;

  public exampleValue$: Observable<AddressDataValue>;

  constructor(private configurationService: ConfigurationService) {
    this.exampleAddressesMap = {
      example: [addressExample(this.configurationService.getConfiguration())],
    };
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
      this.exampleValue$ = this.bindExampleValue();
    }
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private bindExampleValue(): Observable<AddressDataValue> {
    return this.form.valueChanges.pipe(
      startWith(this.form.value),
      map(config => new AddressDataValue('example', config, {addressesMap: this.exampleAddressesMap}))
    );
  }

  private createForm() {
    this.form.addControl(
      AddressConstraintFormControl.Fields,
      new FormControl(
        this.config ? this.config.fields : addressDefaultFields(this.configurationService.getConfiguration()),
        fieldsValidator()
      )
    );
  }

  public onOptionsDrop(event: CdkDragDrop<AddressField[]>) {
    if (event.container !== event.previousContainer) {
      this.removeField(event.previousIndex);
    }
  }

  public onFieldsDrop(event: CdkDragDrop<AddressField[]>) {
    if (event.container === event.previousContainer) {
      this.moveField(event.previousIndex, event.currentIndex);
    } else {
      const field = event.previousContainer.data[event.previousIndex];
      this.addField(field, event.currentIndex);
    }
  }

  private addField(field: AddressField, index: number) {
    const fields = [...this.fieldsControl.value];
    fields.splice(index, 0, field);
    this.fieldsControl.setValue(fields);
  }

  private removeField(previousIndex: number) {
    const fields = this.fieldsControl.value.filter((item, index) => index !== previousIndex);
    this.fieldsControl.setValue(fields);
  }

  private moveField(previousIndex: number, nextIndex: number) {
    const fields = [...this.fieldsControl.value];
    const [field] = fields.splice(previousIndex, 1);
    fields.splice(nextIndex, 0, field);
    this.fieldsControl.setValue(fields);
  }

  public get fieldsControl(): AbstractControl {
    return this.form.get(AddressConstraintFormControl.Fields);
  }
}

function fieldsValidator(): ValidatorFn {
  return (formControl: FormControl): ValidationErrors | null => {
    return (formControl.value || []).length ? null : {emptyFields: true};
  };
}
