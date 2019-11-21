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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {DateTimeConstraintConfig} from '../../../../../../core/model/data/constraint-config';
import {TemplateService} from '../../../../../../core/service/template.service';
import {DateTimeDataValue} from '../../../../../../core/model/data-value/datetime.data-value';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {minMaxValidator} from '../../../../../../core/validators/min-max-validator';
import {DatetimeConstraintFormControl} from './datetime-constraint-form-control';
import {DataValueInputType} from '../../../../../../core/model/data-value';
import {createDateTimeOptions, hasDateOption, hasTimeOption} from '../../../../../date-time/date-time-options';

@Component({
  selector: 'datetime-constraint-config-form',
  templateUrl: './datetime-constraint-config-form.component.html',
  styleUrls: ['./datetime-constraint-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeConstraintConfigFormComponent implements OnInit, OnChanges {
  @Input()
  public config: DateTimeConstraintConfig;

  @Input()
  public form: FormGroup;

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

  public exampleValue$: Observable<DateTimeDataValue>;

  constructor(private templateService: TemplateService, private i18n: I18n) {
    this.formatItems = this.createFormatItems();
  }

  public ngOnInit() {
    this.exampleValue$ = this.bindExampleValue();
    this.helpUrl = this.templateService.getDateTimeConstraintHelpUrl();
  }

  private bindExampleValue(): Observable<DateTimeDataValue> {
    return this.form.valueChanges.pipe(
      startWith(this.form.value),
      map(value => {
        const config: DateTimeConstraintConfig = {
          format: value.format || value.customFormat,
          minValue: undefined,
          maxValue: undefined,
          range: undefined,
        };
        return new DateTimeDataValue(new Date().toISOString(), DataValueInputType.Stored, config);
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
    const format = (this.config && this.config.format) || this.formats[0];
    const selectFormat = this.formats.includes(format) ? format : '';
    this.form.addControl(DatetimeConstraintFormControl.Format, new FormControl(selectFormat));
    this.form.addControl(DatetimeConstraintFormControl.CustomFormat, new FormControl(format));

    this.form.addControl(DatetimeConstraintFormControl.MinValue, new FormControl(this.config && this.config.minValue));
    this.form.addControl(DatetimeConstraintFormControl.MaxValue, new FormControl(this.config && this.config.maxValue));
    this.form.setValidators([
      minMaxValidator(DatetimeConstraintFormControl.MinValue, DatetimeConstraintFormControl.MaxValue),
      customFormatValidator(),
    ]);
  }

  public get formatControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.Format);
  }

  public get minValueControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.MinValue);
  }

  public get maxValueControl(): AbstractControl {
    return this.form.get(DatetimeConstraintFormControl.MaxValue);
  }

  private createFormatItems(): SelectItemModel[] {
    const formatItems = this.formats.map(format => ({id: format, value: format}));
    const customItem = {id: '', value: this.i18n({id: 'constraint.dateTime.format.custom', value: 'Custom'})};
    return [...formatItems, customItem];
  }
}

export function customFormatValidator(): ValidatorFn {
  return (form: FormGroup): ValidationErrors | null => {
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
