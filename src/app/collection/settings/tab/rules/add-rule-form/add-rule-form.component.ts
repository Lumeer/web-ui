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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AbstractControl, FormBuilder, ValidatorFn} from '@angular/forms';
import {Rule, RuleConfiguration, RuleTiming, RuleType, RuleTypeMap} from '../../../../../core/model/rule';
import {Subscription} from 'rxjs';
import {Collection} from '../../../../../core/store/collections/collection';

@Component({
  selector: '[add-rule-form]',
  templateUrl: './add-rule-form.component.html',
  styleUrls: ['./add-rule-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRuleFormComponent implements OnInit, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public rule: Rule;

  @Input()
  public ruleIndex: number;

  @Input()
  public ruleNames: string[] = [];

  @Output()
  public onCancelNewRule = new EventEmitter<number>();

  public readonly types = Object.values(RuleTypeMap);

  public form;

  private formSubscription: Subscription;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.form = this.fb.group({
      name: [this.rule.name, this.usedNameValidator()],
      timingCreate: this.hasCreate(this.rule.timing),
      timingUpdate: this.hasUpdate(this.rule.timing),
      timingDelete: [
        {
          value: this.rule.type === RuleType.AutoLink || this.hasDelete(this.rule.timing),
          disabled: this.rule.type === RuleType.AutoLink,
        },
      ],
      type: RuleType.AutoLink,
      config: this.fb.group({}),
    });

    this.formSubscription = this.form.get('type').statusChanges.subscribe(status => {
      const type = this.form.get('type').value;
      if (type === RuleType.AutoLink) {
        const timingDelete = this.form.get('timingDelete');
        timingDelete.setValue(this.hasDelete(this.rule.timing));
        timingDelete.disable();
      } else {
        const timingDelete = this.form.get('timingDelete');
        timingDelete.enable();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  private hasCreate(timing: RuleTiming): boolean {
    return [RuleTiming.All, RuleTiming.Create, RuleTiming.CreateUpdate, RuleTiming.CreateDelete].indexOf(timing) >= 0;
  }

  private hasUpdate(timing: RuleTiming): boolean {
    return [RuleTiming.All, RuleTiming.Update, RuleTiming.CreateUpdate, RuleTiming.UpdateDelete].indexOf(timing) >= 0;
  }

  private hasDelete(timing: RuleTiming): boolean {
    return [RuleTiming.All, RuleTiming.Delete, RuleTiming.CreateDelete, RuleTiming.UpdateDelete].indexOf(timing) >= 0;
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get name(): AbstractControl {
    return this.form.get('name');
  }

  public get configForm(): AbstractControl {
    return this.form.get('config');
  }

  public get ruleConfiguration(): RuleConfiguration {
    switch (this.rule.type) {
      case RuleType.AutoLink:
        return {
          attribute1: this.rule.configuration.attribute1, //this.configForm.get('attribute1').value,
          attribute2: this.rule.configuration.attribute2, //this.configForm.get('attribute2').value,
          linkType: this.rule.configuration.linkType, //this.configForm.get('linkType').value,
          collection1: this.rule.configuration.collection1, //this.configForm.get('collection1').value,
          collection2: this.rule.configuration.collection2, //this.configForm.get('collection2').value
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

  public fireCancelNewRule(): void {
    this.onCancelNewRule.emit(this.ruleIndex);
  }

  public usedNameValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const used = this.ruleNames.indexOf(control.value) >= 0;
      return used ? {usedRuleName: {value: control.value}} : null;
    };
  }
}
