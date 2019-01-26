/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {FormControl, FormGroup} from '@angular/forms';
import {removeAllFormControls} from '../../../../../../shared/utils/form.utils';
import {AutoLinkRuleConfiguration} from '../../../../../../core/model/rule';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'auto-link-form',
  templateUrl: './auto-link-form.component.html',
  styleUrls: ['./auto-link-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoLinkFormComponent implements OnChanges {
  @Input()
  public config: AutoLinkRuleConfiguration;

  @Input()
  public form: FormGroup;

  public selectItems: SelectItemModel[] = [
    {id: 1, value: 'super truper link', icons: ['fas fa-eye', 'fas fa-plus'], iconColors: ['#ff7700', '#0077FF']},
    {id: 2, value: 'úplně jiný link', icons: ['fas fa-trash', 'fas fa-cog'], iconColors: ['#ff7700', '#0077FF']},
  ];

  public attributes1: SelectItemModel[] = [
    {id: 'a1', value: 'Attr1', icons: ['fas fa-cog'], iconColors: ['#DD00DD']},
    {id: 'a2', value: 'Attr2', icons: ['fas fa-plus'], iconColors: ['#FFDD00']},
  ];

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
    this.form.addControl('attribute1', new FormControl(this.config && this.config.attribute1));
    this.form.addControl('attribute2', new FormControl(this.config && this.config.attribute2));
    this.form.addControl('linkType', new FormControl(this.config && this.config.linkType));
  }
}
