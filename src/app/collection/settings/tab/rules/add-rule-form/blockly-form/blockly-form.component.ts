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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {BlocklyRuleConfiguration} from '../../../../../../core/model/rule';

@Component({
  selector: 'blockly-form',
  templateUrl: './blockly-form.component.html',
  styleUrls: ['./blockly-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyFormComponent {
  @Input()
  public config: BlocklyRuleConfiguration;

  @Input()
  public form: FormGroup;

  public displayDebug = '';

  public get blocklyJs(): string {
    return this.form.get('blocklyJs').value;
  }

  public get blocklyDryRunResult(): string {
    return this.form.get('blocklyDryRunResult').value;
  }

  public get blocklyError(): string {
    return this.form.get('blocklyError').value;
  }

  public get blocklyResultTimestamp(): string {
    return this.form.get('blocklyResultTimestamp').value;
  }

  public display(part: string): void {
    if (this.displayDebug === part) {
      this.displayDebug = '';
    } else {
      this.displayDebug = part;
    }
  }
}
