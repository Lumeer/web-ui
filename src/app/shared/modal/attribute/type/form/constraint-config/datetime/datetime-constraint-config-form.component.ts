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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {map, startWith, withLatestFrom} from 'rxjs/operators';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';
import {minMaxValidator} from '../../../../../../../core/validators/min-max-validator';
import {DatetimeConstraintFormControl} from './datetime-constraint-form-control';
import {createDateTimeOptions, hasDateOption, hasTimeOption} from '../../../../../../date-time/date-time-options';
import {LanguageCode} from '../../../../../../../core/model/language';
import {DateTimeConstraintConfig, DateTimeDataValue} from '@lumeer/data-filters';
import {ConfigurationService} from '../../../../../../../configuration/configuration.service';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../../../../core/store/constraint-data/constraint-data.state';
import {AppState} from '../../../../../../../core/store/app.state';
import {isNullOrUndefined} from '../../../../../../utils/common.utils';

@Component({
  selector: 'datetime-constraint-config-form',
  templateUrl: './datetime-constraint-config-form.component.html',
  styleUrls: ['./datetime-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeConstraintConfigFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public config: DateTimeConstraintConfig;

  @Input()
  public form: UntypedFormGroup;

  public helpUrl: string;

  public readonly now = new Date().toISOString();

  public readonly formats = [
    'DD.MM.YYYY',
    'DD.MM.YYYY H:mm',
    'YYYY-MM-DD',
    'YYYY-MM-DD H:mm',
    'DD/MM/YYYY',
    'DD/MM/YYYY h:mm a',
    'MM/DD/YYYY',
    'MM/DD/YYYY h:mm a',
    'H:mm',
    'h:mm a',
  ];

  public readonly formatItems: SelectItemModel[];
  public readonly formControlName = DatetimeConstraintFormControl;

  public exampleValue$: Observable<DateTimeDataValue>;

  private formatSubscription = new Subscription();

  constructor(
    private configurationService: ConfigurationService,
    private store$: Store<AppState>
  ) {
    this.formatItems = this.createFormatItems();
  }

  public ngOnInit() {
    this.exampleValue$ = this.bindExampleValue();
    this.helpUrl = this.getDateTimeConstraintHelpUrl();
  }

  public getDateTimeConstraintHelpUrl(): string {
    switch (this.configurationService.getConfiguration().locale) {
      case LanguageCode.CZ:
        return this.createUrl('cs/typ-sloupce-datum');
      default:
        return this.createUrl('date-column-type');
    }
  }

  private createUrl(suffix: string): string {
    return `${this.configurationService.getConfiguration().pageUrl}/${suffix}`;
  }

  private bindExampleValue(): Observable<DateTimeDataValue> {
    return this.form.valueChanges.pipe(
      startWith(this.form.value),
      withLatestFrom(this.store$.pipe(select(selectConstraintData))),
      map(([value, constraintData]) => {
        const config: DateTimeConstraintConfig = {
          format: value.format || value.customFormat,
          minValue: undefined,
          maxValue: undefined,
          range: undefined,
        };
        return new DateTimeDataValue(new Date().toISOString(), config, constraintData);
      })
    );
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
    const format = this.config?.format || this.formats[0];
    const selectFormat = this.formats.includes(format) ? format : '';
    this.form.addControl(DatetimeConstraintFormControl.Format, new UntypedFormControl(selectFormat));
    this.form.addControl(DatetimeConstraintFormControl.CustomFormat, new UntypedFormControl(format));

    const asUtc = this.config ? this.config.asUtc || false : isFormatInUtc(format);
    this.form.addControl(DatetimeConstraintFormControl.Utc, new UntypedFormControl(asUtc));

    this.form.addControl(DatetimeConstraintFormControl.MinValue, new UntypedFormControl(this.config?.minValue));
    this.form.addControl(DatetimeConstraintFormControl.MaxValue, new UntypedFormControl(this.config?.maxValue));
    this.form.setValidators([
      minMaxValidator(DatetimeConstraintFormControl.MinValue, DatetimeConstraintFormControl.MaxValue),
      customFormatValidator(),
    ]);

    this.subscribeFormatChange();
  }

  private subscribeFormatChange() {
    this.formatSubscription.unsubscribe();
    this.formatSubscription = new Subscription();
    this.formatSubscription.add(
      this.formatControl.valueChanges.subscribe(() => {
        const format = this.formatControl.value;
        if (format && !this.asUtcControl.touched && isNullOrUndefined(this.config?.asUtc)) {
          this.asUtcControl.setValue(isFormatInUtc(format));
        }
      })
    );
  }

  public get formatControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.Format);
  }

  public get asUtcControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.Utc);
  }

  public get minValueControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.MinValue);
  }

  public get maxValueControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.MaxValue);
  }

  private createFormatItems(): SelectItemModel[] {
    const formatItems = this.formats.map(format => ({id: format, value: format}));
    const customItem = {id: '', value: $localize`:@@constraint.dateTime.format.custom:Custom`};
    return [...formatItems, customItem];
  }

  public ngOnDestroy() {
    this.formatSubscription.unsubscribe();
  }
}

function isFormatInUtc(format: string): boolean {
  return !hasTimeOption(createDateTimeOptions(format));
}

function customFormatValidator(): ValidatorFn {
  return (form: UntypedFormGroup): ValidationErrors | null => {
    const format = form.get(DatetimeConstraintFormControl.Format).value;
    const customFormat = form.get(DatetimeConstraintFormControl.CustomFormat).value;

    if (format) {
      return null;
    }

    if (!(customFormat || '').toString().trim()) {
      return {customEmpty: true};
    }

    const options = createDateTimeOptions(customFormat);
    if (!hasDateOption(options) && !hasTimeOption(options)) {
      return {customInvalid: true};
    }

    return null;
  };
}
