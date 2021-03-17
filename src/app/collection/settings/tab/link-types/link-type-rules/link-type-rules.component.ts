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
import {Rule, RuleTiming, RuleType} from '../../../../../core/model/rule';
import {BehaviorSubject, Observable} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {selectServiceLimitsByWorkspace} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {filter, first, map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store/app.state';
import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {RouterAction} from '../../../../../core/store/router/router.action';
import {LinkTypesAction} from '../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {containsAttributeWithRule} from '../../../../../shared/utils/attribute.utils';
import {generateId} from '../../../../../shared/utils/resource.utils';

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

  public rulesCountLimit$: Observable<number>;
  public ruleNames$: Observable<string[]>;
  public editingRules$ = new BehaviorSubject<Record<string, boolean>>({});

  public addingRules: Rule[] = [];

  private readonly copyOf: string;

  public constructor(private store$: Store<AppState>) {
    this.copyOf = $localize`:@@collection.config.tab.rules.prefix.copyOf:Copy of`;
  }

  public ngOnInit(): void {
    this.rulesCountLimit$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      filter(limits => !!limits),
      map(serviceLimits => serviceLimits.rulesPerCollection)
    );
    this.ruleNames$ = this.store$.pipe(
      select(selectLinkTypeById(this.linkType.id)),
      map(linkType => linkType?.rules?.map(r => r.name) || [])
    );
  }

  public onNewRule(): void {
    this.addingRules.push(this.getEmptyRule());
  }

  public onDuplicateRule(rule: Rule): void {
    this.addingRules.push({...rule, name: this.copyOf + ' ' + rule.name, id: generateId()});
  }

  public onCancelNewRule(index: number): void {
    this.addingRules.splice(index, 1);
  }

  public onCancelRuleEdit(rule: Rule) {
    this.setEditingRule(rule, false);
  }

  public onEditStart(rule: Rule) {
    this.setEditingRule(rule, true);
  }

  private setEditingRule(rule: Rule, editing: boolean) {
    const editingRules = {...this.editingRules$.value, [rule.id]: editing};
    this.editingRules$.next(editingRules);
  }

  public trackByRuleName(index: number, rule: Rule): string {
    return rule.id || rule.name;
  }

  public onSaveRule(linkType: LinkType, idx: number, rule: Rule) {
    this.store$.dispatch(new LinkTypesAction.UpsertRule({linkTypeId: linkType.id, rule}));

    const index = linkType.rules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      this.onCancelRuleEdit(rule);
    } else {
      this.onCancelNewRule(idx);
    }
  }

  private getEmptyRule(): Rule {
    const count = (this.linkType.rules?.length || 0) + 1;
    const rulePrefix = $localize`:@@collection.config.tab.rules.newRule.prefix:Rule`;

    return {
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
  }

  public deleteRule(linkType: LinkType, rule: Rule) {
    const updatedRules = linkType.rules.slice();
    const index = updatedRules.findIndex(r => r.id === rule.id);

    if (index >= 0) {
      updatedRules.splice(index, 1);
      const updatedCollection = {...linkType, rules: updatedRules};

      this.showRemoveConfirm(updatedCollection, rule);
    }
  }

  private showRemoveConfirm(linkType: LinkType, rule: Rule) {
    const updateAction = new LinkTypesAction.Update({linkType});
    const confirmAction = this.createConfirmAction(updateAction, containsAttributeWithRule(linkType.attributes, rule));
    this.store$.dispatch(confirmAction);
  }

  private createConfirmAction(action: Action, isBeingUsed: boolean): NotificationsAction.Confirm {
    const title = $localize`:@@collection.config.tab.rules.remove.title:Delete this rule?`;
    let message = $localize`:@@collection.config.tab.rules.remove.message:Do you really want to delete this rule?`;

    if (isBeingUsed) {
      const additionalMessage = $localize`:@@collection.config.tab.rules.remove.message.used:This rule is being used in an action button.`;
      message = `${message} ${additionalMessage}`;
    }

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
