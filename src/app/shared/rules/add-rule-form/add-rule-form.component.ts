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
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import * as moment from 'moment';
import {Subscription} from 'rxjs';

import {isDateValid} from '@lumeer/utils';

import {ConfigurationService} from '../../../configuration/configuration.service';
import {
  ChronoUnit,
  Rule,
  RuleConfiguration,
  RuleTiming,
  RuleType,
  createRuleTiming,
  ruleTimingHasCreate,
  ruleTimingHasDelete,
  ruleTimingHasUpdate,
  ruleTypeMap,
} from '../../../core/model/rule';
import {Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {minLengthValidator} from '../../../core/validators/custom-validators';
import {SelectItemModel} from '../../select/select-item/select-item.model';
import {objectChanged, objectValues} from '../../utils/common.utils';
import {RuleOffsetType, offsetRuleConfig} from '../../utils/rule.utils';
import {parseSelectTranslation} from '../../utils/translation.utils';

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

  public form: UntypedFormGroup;
  public typeItems: SelectItemModel[];

  private formSubscription: Subscription;

  public readonly ruleType = RuleType;

  constructor(
    private fb: UntypedFormBuilder,
    private configuration: ConfigurationService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.ruleNames) {
      // there can be a new rule added that clashes with currently entered name
      this.nameControl?.updateValueAndValidity();
    }
    if (objectChanged(changes.collection) || objectChanged(changes.linkType)) {
      this.typeItems = this.createTypeItems();
    }
  }

  public ngOnInit() {
    this.form = this.fb.group({
      id: this.rule.id,
      name: [this.rule.name, [Validators.required, this.usedNameValidator(), minLengthValidator(1)]],
      timingCreate: ruleTimingHasCreate(this.rule.timing),
      timingUpdate: ruleTimingHasUpdate(this.rule.timing),
      timingDelete: [
        {
          value: this.rule.type === RuleType.AutoLink || ruleTimingHasDelete(this.rule.timing),
          disabled: this.rule.type === RuleType.AutoLink,
        },
      ],
      type: this.rule.type,
      configAutoLink: this.fb.group({
        collection1: this.rule.type === RuleType.AutoLink ? this.rule.configuration.collection1 : '',
        collection2: this.rule.type === RuleType.AutoLink ? this.rule.configuration.collection2 : '',
        attribute1: this.rule.type === RuleType.AutoLink ? this.rule.configuration.attribute1 : '',
        attribute2: this.rule.type === RuleType.AutoLink ? this.rule.configuration.attribute2 : '',
        linkType: this.rule.type === RuleType.AutoLink ? this.rule.configuration.linkType : '',
      }),
      configBlockly: this.fb.group(this.getBlocklyGroup()),
      configCron: this.fb.group({...this.getBlocklyGroup(), ...this.getCronGroup()}),
    });
    this.form.setValidators(this.formValidator());

    this.formSubscription = this.typeControl.valueChanges.subscribe(type => this.checkTimers(type));
  }

  private checkTimers(type: RuleType) {
    switch (type) {
      case RuleType.AutoLink: {
        this.timingDeleteControl.setValue(true);
        this.timingDeleteControl.disable();
        break;
      }
      default:
        this.timingDeleteControl.enable();
    }
  }

  private getBlocklyGroup(): Record<string, any> {
    if (this.rule.type === RuleType.Blockly || this.rule.type === RuleType.Cron) {
      return {
        blocklyXml: this.rule.configuration.blocklyXml,
        blocklyJs: this.rule.configuration.blocklyJs,
        blocklyDryRun: this.rule.configuration.blocklyDryRun,
        blocklyDryRunResult: this.rule.configuration.blocklyDryRunResult,
        blocklyError: this.rule.configuration.blocklyError,
        blocklyResultTimestamp: this.rule.configuration.blocklyResultTimestamp,
        blocklyRecursive: this.rule.configuration.blocklyRecursive,
      };
    } else {
      return {
        blocklyXml: '',
        blocklyJs: '',
        blocklyDryRun: false,
        blocklyDryRunResult: '',
        blocklyError: '',
        blocklyResultTimestamp: '',
        blocklyRecursive: false,
      };
    }
  }

  private getCronGroup(): Record<string, any> {
    const offsetRule = offsetRuleConfig(this.rule, RuleOffsetType.Up);
    if (offsetRule.type === RuleType.Cron) {
      return {
        startsOn: offsetRule.configuration.startsOn,
        endsOn: offsetRule.configuration.endsOn,
        interval: offsetRule.configuration.interval,

        hour: offsetRule.configuration.hour,
        daysOfWeek: offsetRule.configuration.daysOfWeek,
        occurrence: offsetRule.configuration.occurrence,

        unit: offsetRule.configuration.unit || ChronoUnit.Weeks,
        viewId: offsetRule.configuration.viewId,
        executionsLeft: offsetRule.configuration.executionsLeft,
        language: this.configuration.getConfiguration().locale,
      };
    } else {
      return {
        startsOn: moment.utc().startOf('day').toDate(),
        endsOn: undefined,
        hour: '0',
        interval: 1,
        daysOfWeek: 0,
        occurrence: 1,
        unit: ChronoUnit.Weeks,
        viewId: undefined,
        executionsLeft: undefined,
        language: this.configuration.getConfiguration().locale,
      };
    }
  }

  public ngOnDestroy() {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  public get typeControl(): AbstractControl {
    return this.form?.get('type');
  }

  public get nameControl(): AbstractControl {
    return this.form?.get('name');
  }

  public get timingCreateControl(): AbstractControl {
    return this.form?.get('timingCreate');
  }

  public get timingUpdateControl(): AbstractControl {
    return this.form?.get('timingUpdate');
  }

  public get allTimings(): AbstractControl[] {
    return [this.timingCreateControl, this.timingUpdateControl, this.timingDeleteControl].filter(timer => !!timer);
  }

  public get timingDeleteControl(): AbstractControl {
    return this.form?.get('timingDelete');
  }

  public get configAutoLink(): UntypedFormGroup {
    return this.form.get('configAutoLink') as UntypedFormGroup;
  }

  public get configBlockly(): UntypedFormGroup {
    return this.form.get('configBlockly') as UntypedFormGroup;
  }

  public get configCron(): UntypedFormGroup {
    return this.form.get('configCron') as UntypedFormGroup;
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
      case RuleType.Cron:
        return {
          ...this.configCron.value,
        };
    }
  }

  public getRuleFromForm(): Rule {
    return {
      id: this.form.get('id').value,
      type: this.typeControl.value,
      name: this.nameControl.value.trim(),
      timing: this.createRuleTiming(),
      configuration: this.getRuleConfiguration(this.typeControl.value),
    } as Rule;
  }

  private createRuleTiming(): RuleTiming {
    switch (this.typeControl.value) {
      case RuleType.Cron:
        return null;
      case RuleType.AutoLink:
        return createRuleTiming(this.timingCreateControl.value, this.timingUpdateControl.value, true);
      default:
        return createRuleTiming(
          this.timingCreateControl.value,
          this.timingUpdateControl.value,
          this.timingDeleteControl.value
        );
    }
  }

  public onCancel() {
    this.onCancelNewRule.emit(this.ruleIndex);
  }

  public usedNameValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (this.originalRuleName && this.originalRuleName === control.value) {
        return null;
      }
      const used = this.ruleNames.indexOf(control.value.trim()) >= 0;
      return used ? {usedRuleName: {value: control.value}} : null;
    };
  }

  public formValidator(): ValidatorFn {
    return (form: UntypedFormGroup): ValidationErrors | null => {
      const configCron = form.get('configCron');
      if (form.get('type').value === RuleType.AutoLink) {
        const config = form.get('configAutoLink');
        if (!(config.get('attribute1').value && config.get('attribute2').value && config.get('linkType').value)) {
          return {required: ['attribute1', 'attribute2', 'linkType']};
        }
      } else if (form.get('type').value === RuleType.Cron) {
        const unit = configCron.get('unit').value;
        if (unit === ChronoUnit.Weeks && !configCron.get('daysOfWeek').value) {
          configCron.setErrors({daysOfWeekRequired: true});
          return null;
        }
        const startsOn = <Date>configCron.get('startsOn').value;
        if (!isDateValid(startsOn)) {
          configCron.setErrors({startsOnRequired: true});
          return null;
        }
        const endsOn = <Date>configCron.get('endsOn').value;
        if (isDateValid(endsOn) && endsOn.getTime() <= startsOn.getTime()) {
          configCron.setErrors({endsOnInvalid: true});
          return null;
        }
      }
      configCron.setErrors(null);
      return null;
    };
  }

  public submitRule() {
    const rule = this.getRuleFromForm();
    const offsetRule = offsetRuleConfig(rule, RuleOffsetType.Down);
    this.onSaveRule.emit(offsetRule);
  }

  private createTypeItems(): SelectItemModel[] {
    return this.types
      .filter(
        type => type !== RuleType.Zapier && type !== RuleType.Workflow && (!this.linkType || type !== RuleType.Cron)
      )
      .map(type => ({
        id: type,
        value: parseSelectTranslation(
          $localize`:@@collection.config.tab.rules.type:{VAR_SELECT, select, AUTO_LINK {Automated link} BLOCKLY {Blockly} ZAPIER {Zapier} CRON {Timer} WORKFLOW {Workflow}}`,
          {VAR_SELECT: type}
        ),
      }));
  }
}
