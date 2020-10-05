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
import {NumberConstraintConfig} from '../../../../../../core/model/data/constraint-config';
import {minMaxValidator} from '../../../../../../core/validators/min-max-validator';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {NumberConstraintFormControl} from './number-constraint-form-control';
import {NumberDataValue} from '../../../../../../core/model/data-value/number.data-value';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {NumberConstraint} from '../../../../../../core/model/constraint/number.constraint';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {LanguageTag} from '../../../../../../core/model/data/language-tag';
import {objectValues} from '../../../../../utils/common.utils';

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

  constructor(private i18n: I18n) {
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
      map(() => this.createNumberDataValue())
    );
  }

  private createNumberDataValue(): NumberDataValue {
    const config: NumberConstraintConfig = this.form.value;
    let exampleValue = 123456789.123456789;
    if (config.negative) {
      exampleValue *= -1;
    }

    return new NumberConstraint(config).createDataValue(exampleValue);
  }

  private createCurrencySelectItems(): SelectItemModel[] {
    return objectValues(LanguageTag)
      .map(tag => ({
        id: tag,
        value: this.translateLanguageTag(tag),
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }

  private translateLanguageTag(tag: LanguageTag): string {
    return this.i18n(
      {
        id: 'constraint.number.currency.select',
        value:
          '{tag, select, da-DK {Denmark - kr (DKK)} de-CH {Switzerland - CHF} en-NZ {New Zealand - $ (NZD)} fr-CA {Canada - $ (CAD)} sv-SE {Sweden - kr (SEK)} nb-NO {Norway - kr (NOK)} fi-FI {Finland - € (EUR)} he-IL {Israel - ₪ (ILS)} es-ES {Spain - € (EUR)} fr-FR {France - € (EUR)} it-IT {Italy - € (EUR)} en-GB {United Kingdom - £ (GBP)} pt-PT {Portugal - € (EUR)} pl-PL {Poland - zł (PLN)} cs-CZ {Czech Republic - Kč (CZK)} sk-SK {Slovak Republic - € (EUR)} hu-HU {Hungary - Ft (HUF)} de-AT {Austria - € (EUR)} de-DE {Germany - € (EUR)} en-US {United States - $ (USD)} pt-BR {Brazil - R$ (BRL)} zh-TW {Taiwan - NT$ (TWD)} nl-NL {Netherland - € (EUR)} zh-CN {China - ¥ (CNY)} ru-RU {Russia - руб. (RUB)} ja-JP {Japan - ¥ (JPY)} en-AU {Australia - $ (AUD)}}',
      },
      {tag}
    );
  }

  public onCurrencySelect(tag: LanguageTag) {
    this.currencyControl.setValue(tag);
  }
}
