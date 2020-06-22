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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {BlocklyRule, Rule, RuleTiming, RuleType} from '../../../../../core/model/rule';
import {Observable, Subscription} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {selectServiceLimitsByWorkspace} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {filter, first, map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {RouterAction} from '../../../../../core/store/router/router.action';
import {LinkTypesAction} from '../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';

@Component({
  selector: 'link-type-rules',
  templateUrl: './link-type-rules.component.html',
  styleUrls: ['./link-type-rules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeRulesComponent implements OnInit {
  @Input()
  public linkType: LinkType;

  @Output()
  public linkTypeUpdate = new EventEmitter<LinkType>();

  public ruleNames = [];
  public addingRules: Rule[] = [];
  public editingRules: Record<string, boolean> = {};
  public rulesCountLimit$: Observable<number>;
  private subscriptions = new Subscription();

  public constructor(private store$: Store<AppState>, private i18n: I18n) {}

  public ngOnInit(): void {
    this.ruleNames = this.linkType.rules.map(r => r.name);
    this.rulesCountLimit$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      filter(limits => !!limits),
      map(serviceLimits => serviceLimits.rulesPerCollection)
    );
    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectLinkTypeById(this.linkType.id)),
          map(linkType => linkType?.rules?.map(r => r.name))
        )
        .subscribe(ruleNames => (this.ruleNames = ruleNames))
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onNewRule(): void {
    this.addingRules.push(this.getEmptyRule());
  }

  public onCancelNewRule(index: number): void {
    this.addingRules.splice(index, 1);
  }

  public onCancelRuleEdit(idx: number) {
    this.editingRules[this.ruleNames[idx]] = false;
  }

  public trackByRuleName(index: number, rule: Rule): string {
    return rule.name;
  }

  public onSaveRule(linkType: LinkType, idx: number, rule: Rule, originalRuleName?: string) {
    const index = linkType.rules.findIndex(r => r.name === (originalRuleName ? originalRuleName : rule.name));

    const rules = [...linkType.rules];
    if (index >= 0) {
      rules.splice(index, 1, rule);
    } else {
      rules.push(rule);
    }

    this.store$.dispatch(new LinkTypesAction.Update({linkType: {...linkType, rules}}));

    if (index >= 0) {
      this.onCancelRuleEdit(idx);
    } else {
      this.onCancelNewRule(idx);
    }
  }

  private getEmptyRule(): Rule {
    const count = (this.linkType.rules?.length || 0) + 1;
    const rulePrefix = this.i18n({id: 'collection.config.tab.rules.newRule.prefix', value: 'Rule'});

    const blocklyRule: BlocklyRule = {
      name: rulePrefix + ' ' + count,
      timing: RuleTiming.All,
      type: RuleType.Blockly,
      configuration: {
        blocklyDryRun: false,
        blocklyError: '',
        blocklyDryRunResult: '',
        blocklyJs: '',
        blocklyXml: '',
        blocklyResultTimestamp: 0,
      },
    };

    return blocklyRule;
  }

  public deleteRule(linkType: LinkType, rule: Rule) {
    const updatedRules = linkType.rules.slice();
    const index = updatedRules.findIndex(r => r.name === rule.name);

    if (index >= 0) {
      updatedRules.splice(index, 1);
      const updatedCollection = {...linkType, rules: updatedRules};

      this.showRemoveConfirm(updatedCollection);
    }
  }

  private showRemoveConfirm(linkType: LinkType) {
    const updateAction = new LinkTypesAction.Update({linkType});
    const confirmAction = this.createConfirmAction(updateAction);
    this.store$.dispatch(confirmAction);
  }

  private createConfirmAction(action: Action): NotificationsAction.Confirm {
    const title = this.i18n({id: 'collection.config.tab.rules.remove.title', value: 'Delete this rule?'});
    const message = this.i18n({
      id: 'collection.config.tab.rules.remove.message',
      value: 'Do you really want to delete this rule?',
    });

    return new NotificationsAction.Confirm({title, message, type: 'danger', action});
  }

  public openServiceOrder() {
    this.store$
      .pipe(
        select(selectOrganizationByWorkspace),
        map(organization => organization.code),
        first()
      )
      .subscribe(code => {
        this.store$.dispatch(
          new RouterAction.Go({
            path: ['/o', code, 'detail'],
            extras: {fragment: 'orderService'},
          })
        );
      });
  }
}
