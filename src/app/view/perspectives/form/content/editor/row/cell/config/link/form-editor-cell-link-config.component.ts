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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {FormLinkCellConfig} from '../../../../../../../../../core/store/form/form-model';

@Component({
  selector: 'form-editor-cell-link-config',
  templateUrl: './form-editor-cell-link-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorCellLinkConfigComponent implements OnChanges {
  @Input()
  public config: FormLinkCellConfig;

  @Output()
  public configChange = new EventEmitter<FormLinkCellConfig>();

  public minLinks: number;
  public maxLinks: number;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.minLinks = this.config?.minLinks;
      this.maxLinks = this.config?.maxLinks;
    }
  }

  public onMinValueBlur() {
    this.configChange.emit({...this.config, minLinks: this.minLinks});
  }

  public onMaxValueBlur() {
    this.configChange.emit({...this.config, maxLinks: this.maxLinks});
  }
}
