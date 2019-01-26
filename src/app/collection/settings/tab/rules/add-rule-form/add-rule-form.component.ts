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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder} from '@angular/forms';
import {Rule, RuleConfiguration, RuleTiming, RuleType, RuleTypeMap} from '../../../../../core/model/rule';

@Component({
  selector: '[add-rule-form]',
  templateUrl: './add-rule-form.component.html',
  styleUrls: ['./add-rule-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRuleFormComponent implements OnInit {
  public rule: Rule;

  public readonly types = Object.values(RuleTypeMap);

  public form = this.fb.group({
    timingCreate: false,
    timingUpdate: false,
    timingDelete: false,
    type: RuleType.AutoLink,
    config: this.fb.group({}),
  });

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.rule = {
      name: '',
      timing: RuleTiming.All,
      type: RuleType.AutoLink,
      configuration: {attribute1: '', attribute2: '', collection1: '', collection2: '', linkType: ''},
    };
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get configForm(): AbstractControl {
    return this.form.get('config');
  }

  public get ruleConfiguration(): RuleConfiguration {
    switch (this.rule.type) {
      case RuleType.AutoLink:
        return {
          attribute1: '', //this.configForm.get('attribute1').value,
          attribute2: '', //this.configForm.get('attribute2').value,
          linkType: '', //this.configForm.get('linkType').value,
          collection1: '', //this.configForm.get('collection1').value,
          collection2: '', //this.configForm.get('collection2').value
        };
      case RuleType.Blockly:
        return {
          blocklyXml: this.configForm.get('blocklyXml').value,
          blocklyJs: this.configForm.get('blocklyJs').value,
          blocklyDryRun: this.configForm.get('blocklyDryRun').value,
          blocklyDryRunResult: this.configForm.get('blocklyDryRunResult').value,
          blocklyError: this.configForm.get('blocklyError').value,
          blocklyResultTimestamp: this.configForm.get('blocklyResultTimestamp').value,
        };
    }
  }
}
