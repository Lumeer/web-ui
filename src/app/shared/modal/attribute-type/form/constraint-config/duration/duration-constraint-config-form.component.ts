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
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {
  DurationConstraintConversionFormControl,
  DurationConstraintFormControl,
} from './duration-constraint-form-control';
import {TranslationService} from '../../../../../../core/service/translation.service';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {objectValues} from '../../../../../utils/common.utils';
import {
  DurationConstraintConfig,
  durationConstraintUnitMaxValue,
  DurationType,
  DurationUnit,
  getDefaultDurationUnitConversion,
  getPreviousDurationUnit,
} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../../../utils/translation.utils';

@Component({
  selector: 'duration-constraint-config-form',
  templateUrl: './duration-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DurationConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: DurationConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly controls = DurationConstraintFormControl;
  public readonly type = DurationType;
  public readonly types = objectValues(DurationType);
  public readonly units = objectValues(DurationUnit);
  public readonly exampleString: string;
  public readonly typeItems: SelectItemModel[];

  constructor(private translationService: TranslationService) {
    this.exampleString = this.generateExampleString();
    this.typeItems = this.createTypeItems();
  }

  private generateExampleString(): string {
    return objectValues(DurationUnit)
      .map(unit => `${this.generateRandomNumberForUnit(unit)}${this.translateDurationUnit(unit)}`)
      .join('');
  }

  private translateDurationUnit(unit: DurationUnit): string {
    return this.translationService.translateDurationUnit(unit);
  }

  private generateRandomNumberForUnit(unit: DurationUnit): number {
    const previousUnit = getPreviousDurationUnit(unit);
    const maxValue = previousUnit ? durationConstraintUnitMaxValue(previousUnit) - 1 : 5;
    return Math.floor(Math.random() * maxValue) + 1;
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
    const type = (this.config && this.config.type) || DurationType.Work;
    this.form.addControl(DurationConstraintFormControl.Type, new FormControl(type));
    this.form.addControl(
      DurationConstraintFormControl.Conversions,
      new FormArray(this.createConversionControls(type), [])
    );
  }

  private createConversionControls(type: DurationType): AbstractControl[] {
    return this.units.map(unit => this.createConversionUnitControl(type, unit));
  }

  private createConversionUnitControl(type: DurationType, unit: DurationUnit): FormGroup {
    const unitMaxValue = durationConstraintUnitMaxValue(unit);
    return new FormGroup({
      [DurationConstraintConversionFormControl.Unit]: new FormControl(unit),
      [DurationConstraintConversionFormControl.Value]: new FormControl(this.getUnitConversion(type, unit), [
        Validators.min(1),
        Validators.max(unitMaxValue),
      ]),
    });
  }

  private getUnitConversion(type: DurationType, unit: DurationUnit): number {
    if (this.config && this.config.type === type && this.config.conversions) {
      return this.config.conversions[unit];
    }

    return getDefaultDurationUnitConversion(type, unit);
  }

  public onTypeSelect(type: DurationType) {
    this.typeControl.setValue(type);
    this.units.forEach((unit, index) => {
      const conversionValue = this.getUnitConversion(type, unit);
      this.conversionsControl.at(index).get(DurationConstraintConversionFormControl.Value).setValue(conversionValue);
    });
  }

  public get typeControl(): AbstractControl {
    return this.form.get(DurationConstraintFormControl.Type);
  }

  public get conversionsControl(): FormArray {
    return this.form.get(DurationConstraintFormControl.Conversions) as FormArray;
  }

  private createTypeItems(): SelectItemModel[] {
    return this.types.map(type => ({
      id: type,
      value: parseSelectTranslation(
        $localize`:@@constraint.duration.type:{type, select, Work {Work} Classic {Normal} Custom {Custom}}`,
        {type}
      ),
    }));
  }
}
