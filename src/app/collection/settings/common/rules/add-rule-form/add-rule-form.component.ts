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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {Rule, RuleConfiguration, RuleTiming, RuleType, ruleTypeMap} from '../../../../../core/model/rule';
import {Subscription} from 'rxjs';
import {Collection} from '../../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {objectValues} from '../../../../../shared/utils/common.utils';
import {parseSelectTranslation} from '../../../../../shared/utils/translation.utils';

@Component({
  selector: 'add-rule-form',
  templateUrl: './add-rule-form.component.html',
  styleUrls: ['./add-rule-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRuleFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public ruleNames: string[];

  @Input()
  public originalRuleName: string;

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public rule: Rule;

  @Input()
  public ruleIndex: number;

  @Output()
  public onCancelNewRule = new EventEmitter<number>();

  @Output()
  public onSaveRule = new EventEmitter<Rule>();

  public readonly types = objectValues(ruleTypeMap);
  public readonly typeItems: SelectItemModel[];

  public form: FormGroup;

  private formSubscription: Subscription;

  public readonly ruleType = RuleType;

  constructor(private fb: FormBuilder) {
    this.typeItems = this.createTypeItems();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.ruleNames) {
      // there can be a new rule added that clashes with currently entered name
      if (this.form) {
        this.form.get('name').updateValueAndValidity();
      }
    }
  }

  public ngOnInit() {
    this.form = this.fb.group({
      id: this.rule.id,
      name: [this.rule.name, [Validators.required, this.usedNameValidator()]],
      timingCreate: this.hasCreate(this.rule.timing),
      timingUpdate: this.hasUpdate(this.rule.timing),
      timingDelete: [
        {
          value: this.rule.type === RuleType.AutoLink || this.hasDelete(this.rule.timing),
          disabled: this.rule.type === RuleType.AutoLink,
        },
      ],
      type: this.rule.type,
      configAutoLink: this.fb.group({
        collection1: [this.rule.type === RuleType.AutoLink ? this.rule.configuration.collection1 : ''],
        collection2: [this.rule.type === RuleType.AutoLink ? this.rule.configuration.collection2 : ''],
        attribute1: [this.rule.type === RuleType.AutoLink ? this.rule.configuration.attribute1 : ''],
        attribute2: [this.rule.type === RuleType.AutoLink ? this.rule.configuration.attribute2 : ''],
        linkType: [this.rule.type === RuleType.AutoLink ? this.rule.configuration.linkType : ''],
      }),
      configBlockly: this.fb.group({
        blocklyXml: [this.rule.type === RuleType.Blockly ? this.rule.configuration.blocklyXml : ''],
        blocklyJs: [this.rule.type === RuleType.Blockly ? this.rule.configuration.blocklyJs : ''],
        blocklyDryRun: [
          this.rule.type === RuleType.Blockly ? (this.rule.configuration.blocklyDryRun ? true : false) : false,
        ],
        blocklyDryRunResult: [this.rule.type === RuleType.Blockly ? this.rule.configuration.blocklyDryRunResult : ''],
        blocklyError: [this.rule.type === RuleType.Blockly ? this.rule.configuration.blocklyError : ''],
        blocklyResultTimestamp: [
          this.rule.type === RuleType.Blockly ? this.rule.configuration.blocklyResultTimestamp : '',
        ],
      }),
    });
    this.form.setValidators(this.formValidator());

    this.formSubscription = this.form.get('type').valueChanges.subscribe(type => {
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

  private toTiming(hasCreate: boolean, hasUpdate: boolean, hasDelete: boolean): RuleTiming {
    if (hasCreate) {
      if (hasUpdate) {
        if (hasDelete) {
          return RuleTiming.All;
        }
        return RuleTiming.CreateUpdate;
      }
      if (hasDelete) {
        return RuleTiming.CreateDelete;
      }
      return RuleTiming.Create;
    } else {
      if (hasUpdate) {
        if (hasDelete) {
          return RuleTiming.UpdateDelete;
        }
        return RuleTiming.Update;
      }
      if (hasDelete) {
        return RuleTiming.Delete;
      }
    }
    return null;
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get name(): AbstractControl {
    return this.form.get('name');
  }

  public get configAutoLink(): AbstractControl {
    return this.form.get('configAutoLink');
  }

  public get configBlockly(): AbstractControl {
    return this.form.get('configBlockly');
  }

  public getRuleConfiguration(ruleType: RuleType): RuleConfiguration {
    switch (ruleType) {
      case RuleType.AutoLink:
        return {
          ...this.configAutoLink.value,
        };
      case RuleType.Blockly:
        return {
          ...this.configBlockly.value,
        };
    }
  }

  public getRuleFromForm(): Rule {
    return {
      id: this.form.get('id').value,
      type: this.form.get('type').value,
      name: this.form.get('name').value,
      timing: this.toTiming(
        this.form.get('timingCreate').value,
        this.form.get('timingUpdate').value,
        this.form.get('timingDelete').value
      ),
      configuration: this.getRuleConfiguration(this.form.get('type').value),
    } as Rule;
  }

  public fireCancelNewRule(): void {
    this.onCancelNewRule.emit(this.ruleIndex);
  }

  public usedNameValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (this.originalRuleName && this.originalRuleName === control.value) {
        return null;
      }
      const used = this.ruleNames.indexOf(control.value) >= 0;
      return used ? {usedRuleName: {value: control.value}} : null;
    };
  }

  public formValidator(): ValidatorFn {
    return (form: FormGroup): ValidationErrors | null => {
      if (form.get('type').value === RuleType.AutoLink) {
        const config = form.get('configAutoLink');
        if (!(config.get('attribute1').value && config.get('attribute2').value && config.get('linkType').value)) {
          return {required: ['attribute1', 'attribute2', 'linkType']};
        }
      }
      return null;
    };
  }

  public submitRule(): void {
    this.onSaveRule.emit(this.getRuleFromForm());
  }

  private createTypeItems(): SelectItemModel[] {
    return this.types
      .filter(type => type !== RuleType.Zapier)
      .map(type => ({
        id: type,
        value: parseSelectTranslation(
          $localize`:@@collection.config.tab.rules.type:{VAR_SELECT, select, AUTO_LINK {Automated link} BLOCKLY {Blockly} ZAPIER {Zapier}}`,
          {VAR_SELECT: type}
        ),
      }));
  }
}
