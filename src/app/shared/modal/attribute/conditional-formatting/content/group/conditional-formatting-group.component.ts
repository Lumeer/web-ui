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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {AttributesResource} from '../../../../../../core/model/resource';
import {AttributeFormattingGroup} from '../../../../../../core/store/collections/collection';
import {FontStyle} from '../../../../../../core/model/font-style';
import {computeAttributeFormattingStyle, AttributeFormattingStyle} from '../../../../../utils/attribute.utils';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {POPUP_DELAY} from '../../../../../../core/constants';

@Component({
  selector: 'conditional-formatting-group',
  templateUrl: './conditional-formatting-group.component.html',
  styleUrls: ['./conditional-formatting-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalFormattingGroupComponent implements OnInit {
  @Input()
  public form: FormGroup;

  @Input()
  public group: AttributeFormattingGroup;

  @Input()
  public resource: AttributesResource;

  @Output()
  public delete = new EventEmitter();

  public readonly fontStyle = FontStyle;

  public style$: Observable<AttributeFormattingStyle>;

  public readonly popupDelay = POPUP_DELAY;

  public get stylesControl(): AbstractControl {
    return this.form.controls.styles;
  }

  public get colorControl(): AbstractControl {
    return this.form.controls.color;
  }

  public get backgroundControl(): AbstractControl {
    return this.form.controls.background;
  }

  public get filtersControl(): FormArray {
    return <FormArray>this.form.controls.filters;
  }

  public ngOnInit() {
    this.style$ = this.form.valueChanges.pipe(
      startWith(this.form.value),
      map(() => computeAttributeFormattingStyle(this.form.value))
    );
  }

  public toggleStyle(style: FontStyle) {
    let styles = [...(this.stylesControl.value || [])];
    if (styles?.includes(style)) {
      styles = styles.filter(s => s !== style);
    } else {
      styles.push(style);
    }

    this.stylesControl.setValue(styles);
  }

  public onColorChange(color: string) {
    this.colorControl.setValue(color);
  }

  public onBackgroundChange(color: string) {
    this.backgroundControl.setValue(color);
  }

  public resetStyle() {
    this.stylesControl.setValue([]);
    this.backgroundControl.setValue(null);
    this.colorControl.setValue(null);
  }
}
