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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {AttributesResource} from '../../../../../core/model/resource';
import {Attribute} from '../../../../../core/store/collections/collection';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'attribute-lock-content',
  templateUrl: './attribute-lock-content.component.html',
  styleUrls: ['./attribute-lock-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeLockContentComponent implements OnInit {
  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  public form: FormGroup;

  public editable$ = new BehaviorSubject(true);

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.form = this.fb.group({
      filters: this.fb.array([]),
    });
  }

  public get filtersControl(): FormArray {
    return <FormArray>this.form.controls.filters;
  }
}
