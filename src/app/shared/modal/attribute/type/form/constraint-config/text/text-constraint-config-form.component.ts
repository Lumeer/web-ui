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
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';

import {CaseStyle, TextConstraintConfig} from '@lumeer/data-filters';

import {minMaxValidator} from '../../../../../../../core/validators/min-max-validator';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {parseSelectTranslation} from '../../../../../../utils/translation.utils';
import {TextConstraintFormControl} from './text-constraint-form-control';

@Component({
  selector: 'text-constraint-config-form',
  templateUrl: './text-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: TextConstraintConfig;

  @Input()
  public form: UntypedFormGroup;

  public readonly items: SelectItemModel[];

  public textConstraintFormControl = TextConstraintFormControl;

  public constructor() {
    this.items = Object.keys(CaseStyle).map(caseStyle => {
      const value = parseSelectTranslation(
        $localize`:@@constraint.text.caseStyle.value:{caseStyle, select, None {Any case} LowerCase {Lower case} UpperCase {Upper case} TitleCase {Every first letter upper case} SentenceCase {First letter of sentence upper case}}`,
        {caseStyle}
      );
      return {id: caseStyle, value};
    });
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
    const caseStyle = (this.config && this.config.caseStyle) || CaseStyle.None;
    this.form.addControl(TextConstraintFormControl.CaseStyle, new UntypedFormControl(caseStyle));

    this.form.addControl(
      TextConstraintFormControl.MinLength,
      new UntypedFormControl(this.config && this.config.minLength)
    );
    this.form.addControl(
      TextConstraintFormControl.MaxLength,
      new UntypedFormControl(this.config && this.config.maxLength)
    );

    this.form.setValidators(minMaxValidator(TextConstraintFormControl.MinLength, TextConstraintFormControl.MaxLength));
  }

  public onCaseSelect(caseStyle: string) {
    this.form.patchValue({caseStyle});
  }
}
