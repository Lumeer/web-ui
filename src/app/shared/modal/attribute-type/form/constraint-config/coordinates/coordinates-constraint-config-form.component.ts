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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {CoordinatesConstraintFormControl} from './coordinates-constraint-form-control';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {objectValues} from '../../../../../utils/common.utils';
import {CoordinatesConstraintConfig, CoordinatesDataValue, CoordinatesFormat} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../../../utils/translation.utils';

@Component({
  selector: 'coordinates-constraint-config-form',
  templateUrl: './coordinates-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatesConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: CoordinatesConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly controls = CoordinatesConstraintFormControl;
  public readonly formats = objectValues(CoordinatesFormat);
  public readonly coordinatesFormat = CoordinatesFormat;

  public readonly precisions = {
    [CoordinatesFormat.DecimalDegrees]: [0, 1, 2, 3, 4, 5, 6],
    [CoordinatesFormat.DegreesMinutesSeconds]: [0, 1, 2],
  };

  public readonly formatItems: SelectItemModel[];
  public readonly ddPrecisionItems: SelectItemModel[];
  public readonly dmsPrecisionItems: SelectItemModel[];

  public exampleValue$: Observable<CoordinatesDataValue>;

  constructor() {
    this.formatItems = this.createFormatItems();
    this.ddPrecisionItems = this.createDdPrecisionItems();
    this.dmsPrecisionItems = this.createDmsPrecisionItems();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.form.addControl(
      CoordinatesConstraintFormControl.Format,
      new FormControl(this.config?.format || CoordinatesFormat.DecimalDegrees)
    );
    this.form.addControl(
      CoordinatesConstraintFormControl.Precision,
      new FormControl(this.config ? this.config.precision : getDefaultPrecision(this.config && this.config.format))
    );

    this.exampleValue$ = this.bindExampleValue();
  }

  private bindExampleValue(): Observable<CoordinatesDataValue> {
    return this.form.valueChanges.pipe(
      startWith(this.form.value),
      map(config => new CoordinatesDataValue('49.2331315, 16.5701833', config))
    );
  }

  public onFormatSelect(format: CoordinatesFormat) {
    this.formatControl.setValue(format);
    this.precisionControl.setValue(getDefaultPrecision(format));
  }

  public onPrecisionSelect(precision: number) {
    this.precisionControl.setValue(precision);
  }

  public get formatControl(): AbstractControl {
    return this.form.get(CoordinatesConstraintFormControl.Format);
  }

  public get precisionControl(): AbstractControl {
    return this.form.get(CoordinatesConstraintFormControl.Precision);
  }

  private createFormatItems(): SelectItemModel[] {
    return this.formats.map(format => ({
      id: format,
      value: parseSelectTranslation(
        $localize`:@@constraint.coordinates.format.types:{format, select, DD {Decimal degrees} DMS {Degrees, minutes, seconds}}`,
        {format}
      ),
    }));
  }

  private createDdPrecisionItems(): SelectItemModel[] {
    return this.precisions[CoordinatesFormat.DecimalDegrees].map(precision => ({
      id: precision,
      value: parseSelectTranslation(
        $localize`:@@constraint.coordinates.precisions.dd:{precision, select, 0 {0 digits (~ 100 km)} 1 {1 digit (~ 10 km)} 2 {2 digits (~ 1 km)} 3 {3 digits (~ 100 m)} 4 {4 digits (~ 10 m)} 5 {5 digits (~ 1 m)} 6 {6 digits (~ 0.1 m)}}`,
        {precision: precision.toString()}
      ),
    }));
  }

  private createDmsPrecisionItems(): SelectItemModel[] {
    return this.precisions[CoordinatesFormat.DegreesMinutesSeconds].map(precision => ({
      id: precision,
      value: parseSelectTranslation(
        $localize`:@@constraint.coordinates.precisions.dms:{precision, select, 0 {0 digits (~ 30 m)} 1 {1 digit (~ 3 m)} 2 {2 digits (~ 0.3 m)}}`,
        {precision: precision.toString()}
      ),
    }));
  }
}

function getDefaultPrecision(format: CoordinatesFormat): number {
  return format === CoordinatesFormat.DegreesMinutesSeconds ? 0 : 6;
}
