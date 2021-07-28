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
import {minMaxValidator} from '../../../../../../core/validators/min-max-validator';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {NumberConstraintFormControl} from './number-constraint-form-control';
import {Observable} from 'rxjs';
import {map, startWith, withLatestFrom} from 'rxjs/operators';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {isNumeric, objectValues, toNumber} from '../../../../../utils/common.utils';
import {
  ConstraintData,
  LanguageTag,
  NumberConstraint,
  NumberConstraintConfig,
  NumberDataValue,
} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../../../utils/translation.utils';
import {AppState} from '../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../../../core/store/constraint-data/constraint-data.state';
import {TranslationService} from '../../../../../../core/service/translation.service';

@Component({
  selector: 'number-constraint-config-form',
  templateUrl: './number-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: NumberConstraintConfig;

  @Input()
  public form: FormGroup;

  public readonly formControlName = NumberConstraintFormControl;
  public readonly currencySelectItems: SelectItemModel[];

  public exampleValue$: Observable<NumberDataValue>;

  constructor(private store$: Store<AppState>, private translationService: TranslationService) {
    this.currencySelectItems = this.createCurrencySelectItems();
  }

  public get currencyControl(): AbstractControl {
    return this.form.get('currency');
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
    this.form.addControl(NumberConstraintFormControl.Decimals, new FormControl(this.config?.decimals));
    this.form.addControl(NumberConstraintFormControl.Compact, new FormControl(this.config?.compact));
    this.form.addControl(NumberConstraintFormControl.ForceSign, new FormControl(this.config?.forceSign));
    this.form.addControl(NumberConstraintFormControl.Separated, new FormControl(this.config?.separated));
    this.form.addControl(NumberConstraintFormControl.Negative, new FormControl(this.config?.negative));
    this.form.addControl(NumberConstraintFormControl.MinValue, new FormControl(this.config?.minValue?.toFixed()));
    this.form.addControl(NumberConstraintFormControl.MaxValue, new FormControl(this.config?.maxValue?.toFixed()));
    this.form.addControl(NumberConstraintFormControl.Currency, new FormControl(this.config?.currency));
    this.form.setValidators(
      minMaxValidator(NumberConstraintFormControl.MinValue, NumberConstraintFormControl.MaxValue)
    );

    this.exampleValue$ = this.form.valueChanges.pipe(
      startWith(''),
      withLatestFrom(this.store$.pipe(select(selectConstraintData))),
      map(([, constraintData]) => this.createNumberDataValue(constraintData))
    );
  }

  private createNumberDataValue(constraintData: ConstraintData): NumberDataValue {
    const config: NumberConstraintConfig = {...this.form.value};
    let exampleValue = 123456789.123456789;
    if (config.negative) {
      exampleValue *= -1;
    }
    config.decimals = isNumeric(config.decimals) ? toNumber(config.decimals) : null;

    return new NumberConstraint(config).createDataValue(exampleValue, constraintData);
  }

  private createCurrencySelectItems(): SelectItemModel[] {
    return objectValues(LanguageTag)
      .map(tag => ({
        id: tag,
        value: this.translationService.translateLanguageTag(tag),
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  public onCurrencySelect(tag: LanguageTag) {
    this.currencyControl.setValue(tag);
  }
}
