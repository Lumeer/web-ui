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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AutoLinkRule, Rule, RuleTiming, RuleType} from '../../../../core/model/rule';
import {Collection} from '../../../../core/store/collections/collection';
import {BehaviorSubject, Observable} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {filter, first, map} from 'rxjs/operators';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {RouterAction} from '../../../../core/store/router/router.action';
import {selectOrganizationByWorkspace} from '../../../../core/store/organizations/organizations.state';
import {containsAttributeWithRule} from '../../../../shared/utils/attribute.utils';
import {generateId} from '../../../../shared/utils/resource.utils';

@Component({
  selector: 'collection-rules',
  templateUrl: './collection-rules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionRulesComponent implements OnInit {
  public collection$: Observable<Collection>;
  public ruleNames$: Observable<string[]>;
  public editingRules$ = new BehaviorSubject<Record<string, boolean>>({});
  public rulesCountLimit$: Observable<number>;

  public addingRules: Rule[] = [];

  private readonly runRuleTitle: string;
  private readonly runRuleMessage: string;
  private readonly copyOf: string;

  constructor(private store$: Store<AppState>) {
    this.runRuleTitle = $localize`:@@collection.config.tab.rules.run.title:Run the Rule`;
    this.runRuleMessage = $localize`:@@collection.config.tab.rules.run.message:Do you want to run the rule for all the rows in the table now? Please note that this might take significant time to complete.`;
    this.copyOf = $localize`:@@collection.config.tab.rules.prefix.copyOf:Copy of`;
  }

  public ngOnInit(): void {
    this.collection$ = this.store$.select(selectCollectionByWorkspace);
    this.ruleNames$ = this.collection$.pipe(map(collection => collection?.rules.map(r => r.name) || []));
    this.rulesCountLimit$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      filter(limits => !!limits),
      map(serviceLimits => serviceLimits.rulesPerCollection)
    );
  }

  public onNewRule(): void {
    this.addingRules.push(this.getEmptyRule());
  }

  public onDuplicateRule(rule: Rule): void {
    this.addingRules.push({...rule, name: this.copyOf + ' ' + rule.name, id: generateId()});
  }

  private getEmptyRule(): AutoLinkRule {
    return {
      id: generateId(),
      name: 'New Automation Name',
      type: RuleType.AutoLink,
      timing: RuleTiming.All,
      configuration: {
        attribute1: '',
        attribute2: '',
        collection1: '',
        collection2: '',
        linkType: '',
      },
    };
  }

  public onCancelNewRule(index: number): void {
    this.addingRules.splice(index, 1);
  }

  public onSaveRule(collection: Collection, rule: Rule) {
    this.store$.dispatch(
      new CollectionsAction.UpsertRule({
        collectionId: collection.id,
        rule,
        onSuccess: () => {
          if (rule.type === RuleType.AutoLink) {
            this.store$.dispatch(this.getRunRuleConfirmation(collection.id, rule.id));
          }
        },
      })
    );

    const index = collection.rules.findIndex(r => r.id === rule.id);
    if (index >= 0) {
      this.onCancelRuleEdit(rule);
    } else {
      this.onCancelNewRule(index);
    }
  }

  private getRunRuleConfirmation(collectionId: string, ruleId: string): Action {
    return new NotificationsAction.Confirm({
      title: this.runRuleTitle,
      message: this.runRuleMessage,
      action: new CollectionsAction.RunRule({collectionId, ruleId}),
      type: 'warning',
      yesFirst: false,
    });
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

  private showRemoveConfirm(collection: Collection, rule: Rule) {
    const updateAction = new CollectionsAction.Update({collection});
    const confirmAction = this.createConfirmAction(
      updateAction,
      containsAttributeWithRule(collection.attributes, rule)
    );
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

  public deleteRule(collection: Collection, rule: Rule) {
    const updatedRules = collection.rules.slice();
    const index = updatedRules.findIndex(r => r.id === rule.id);

    if (index >= 0) {
      updatedRules.splice(index, 1);
      const updatedCollection = {...collection, rules: updatedRules};

      this.showRemoveConfirm(updatedCollection, rule);
    }
  }

  public trackByRuleName(index: number, rule: Rule): string {
    return rule.id || rule.name;
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
