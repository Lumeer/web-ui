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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AutoLinkRule, Rule, RuleTiming, RuleType} from '../../../../core/model/rule';
import {Collection} from '../../../../core/store/collections/collection';
import {Observable, Subscription} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {filter, first, map} from 'rxjs/operators';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {RouterAction} from '../../../../core/store/router/router.action';
import {selectOrganizationByWorkspace} from '../../../../core/store/organizations/organizations.state';

@Component({
  selector: 'collection-rules',
  templateUrl: './collection-rules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionRulesComponent implements OnInit, OnDestroy {
  public collection$: Observable<Collection>;

  public ruleNames = [];

  public addingRules: Rule[] = [];
  public editingRules: Record<string, boolean> = {};
  public rulesCountLimit$: Observable<number>;

  public subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private i18n: I18n) {}

  public ngOnInit(): void {
    this.collection$ = this.store$.select(selectCollectionByWorkspace);
    this.subscriptions.add(
      this.collection$.pipe(filter(collection => !!collection && !!collection.rules)).subscribe(collection => {
        this.ruleNames = collection.rules.map(r => r.name);
      })
    );
    this.rulesCountLimit$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      map(serviceLimits => serviceLimits.rulesPerCollection)
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onNewRule(): void {
    this.addingRules.push(this.getEmptyRule());
  }

  private getEmptyRule(): AutoLinkRule {
    return {
      name: 'New Rule Name',
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

  public onSaveRule(collection: Collection, idx: number, rule: Rule, originalRuleName?: string) {
    const index = collection.rules.findIndex(r => r.name === (originalRuleName ? originalRuleName : rule.name));

    if (index >= 0) {
      collection.rules.splice(index, 1, rule);
    } else {
      collection.rules.push(rule);
    }

    this.store$.dispatch(new CollectionsAction.Update({collection}));

    if (index >= 0) {
      this.onCancelRuleEdit(idx);
    } else {
      this.onCancelNewRule(idx);
    }
  }

  public onCancelRuleEdit(idx: number) {
    this.editingRules[this.ruleNames[idx]] = false;
  }

  private showRemoveConfirm(collection: Collection) {
    const updateAction = new CollectionsAction.Update({collection});
    const confirmAction = this.createConfirmAction(updateAction);
    this.store$.dispatch(confirmAction);
  }

  private createConfirmAction(action: Action): NotificationsAction.Confirm {
    const title = this.i18n({id: 'collection.config.tab.rules.remove.title', value: 'Delete this rule?'});
    const message = this.i18n({
      id: 'collection.config.tab.rules.remove.message',
      value: 'Do you really want to delete this rule?',
    });

    return new NotificationsAction.Confirm({title, message, action});
  }

  public deleteRule(collection: Collection, rule: Rule) {
    const updatedRules = collection.rules.slice();
    const index = updatedRules.findIndex(r => r.name === rule.name);

    if (index >= 0) {
      updatedRules.splice(index, 1);
      const updatedCollection = {...collection, rules: updatedRules};

      this.showRemoveConfirm(updatedCollection);
    }
  }

  public trackByRuleName(index: number, rule: Rule): string {
    return rule.name;
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
            path: ['/organization', code, 'detail'],
            extras: {fragment: 'orderService'},
          })
        );
      });
  }
}
