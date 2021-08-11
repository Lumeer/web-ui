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
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'map-position-checkbox',
  templateUrl: './map-position-checkbox.component.html',
  styleUrls: ['./map-position-checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPositionCheckboxComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public value: boolean;

  @Output()
  public valueChange = new EventEmitter<boolean>();

  public readonly formControlName = 'positionSaved';
  public readonly form: FormGroup;

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({[this.formControlName]: false});
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToValueChanges());
  }

  private subscribeToValueChanges(): Subscription {
    return this.valueControl.valueChanges.subscribe(value => {
      if (value !== this.value) {
        this.valueChange.emit(value);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value) {
      this.valueControl.setValue(this.value);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public get valueControl(): AbstractControl {
    return this.form.get(this.formControlName);
  }
}
