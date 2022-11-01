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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {AbstractControl, UntypedFormGroup} from '@angular/forms';
import {PercentageConstraintFormControl} from '../percentage-constraint-form-control';
import {PercentageDisplayStyle} from '@lumeer/data-filters';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {ColorPickerComponent} from '../../../../../../../picker/color/color-picker.component';

interface PercentageStyleItem {
  title: string;
  style: PercentageDisplayStyle;
}

@Component({
  selector: 'percentage-constraint-config-style',
  templateUrl: './percentage-constraint-config-style.component.html',
  styleUrls: ['./percentage-constraint-config-style.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentageConstraintConfigStyleComponent implements OnInit {
  @Input()
  public form: UntypedFormGroup;

  public readonly style = PercentageDisplayStyle;
  public readonly items: PercentageStyleItem[];

  public selectedStyle$: Observable<PercentageDisplayStyle>;

  public initialColor: string;

  constructor() {
    this.items = [
      {style: PercentageDisplayStyle.Text, title: $localize`:@@constraint.config.percentage.display.text:Text`},
      {
        style: PercentageDisplayStyle.ProgressBar,
        title: $localize`:@@constraint.config.percentage.display.progress:Progress Bar`,
      },
    ];
  }

  public ngOnInit() {
    this.selectedStyle$ = this.styleControl.valueChanges.pipe(
      startWith(this.styleControl.value),
      map(style => (this.items.some(item => item.style === style) ? style : PercentageDisplayStyle.Text))
    );
  }

  public get colorControl(): AbstractControl {
    return this.form.get(PercentageConstraintFormControl.Color);
  }

  public get styleControl(): AbstractControl {
    return this.form.get(PercentageConstraintFormControl.Style);
  }

  public onSelect(style: PercentageDisplayStyle) {
    this.styleControl.setValue(style);
  }

  public onColorChange(color: string) {
    this.colorControl.patchValue(color);
  }

  public onColorCancel() {
    this.colorControl.patchValue(this.initialColor);
  }

  public onPaletteClick(colorPicker: ColorPickerComponent) {
    this.initialColor = this.colorControl.value;
    colorPicker.open();
  }
}
