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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Rule, RuleTiming} from '../../../../../core/model/rule';

@Component({
  selector: 'single-rule',
  templateUrl: './single-rule.component.html',
  styleUrls: ['./single-rule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleRuleComponent {
  @Input()
  public rule: Rule;

  @Output()
  public onEdit = new EventEmitter<string>();

  @Output()
  public onDelete = new EventEmitter<string>();

  public readonly ruleTiming = RuleTiming;

  public fireEdit(name: string): void {
    this.onEdit.emit(name);
  }

  public fireDelete(name: string): void {
    this.onDelete.emit(name);
  }
}
