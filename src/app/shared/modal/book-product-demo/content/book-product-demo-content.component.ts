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
import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {AbstractControl, UntypedFormGroup} from '@angular/forms';

import {SelectItemModel} from '../../../select/select-item/select-item.model';

@Component({
  selector: 'book-product-demo-content',
  templateUrl: './book-product-demo-content.component.html',
  styleUrls: ['./book-product-demo-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookProductDemoContentComponent {
  @Input()
  public form: UntypedFormGroup;

  public numEmployeesItems: SelectItemModel[] = [
    {id: '1-10', value: '1-10'},
    {id: '11-50', value: '11-50'},
    {id: '51-200', value: '51-200'},
    {id: '201-500', value: '201-500'},
    {id: '501-1000', value: '501-1000'},
    {id: '1001-5000', value: '1001-5000'},
    {id: '5001-10000', value: '5001-10000'},
    {id: '10000+', value: '10000+'},
  ];

  public get nameControl(): AbstractControl {
    return this.form.get('name');
  }

  public get industryControl(): AbstractControl {
    return this.form.get('industry');
  }

  public get numEmployeesControl(): AbstractControl {
    return this.form.get('numEmployees');
  }

  public get useCaseControl(): AbstractControl {
    return this.form.get('useCase');
  }
}
