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
import {AutoLinkRule, Rule, RuleTiming, RuleType} from '../../../../core/model/rule';
import {Collection} from '../../../../core/store/collections/collection';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';

@Component({
  selector: 'collection-rules',
  templateUrl: './collection-rules.component.html',
  styleUrls: ['./collection-rules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionRulesComponent implements OnInit {
  public collection$: Observable<Collection>;

  public rules: Rule[] = [
    {
      name: 'create link',
      type: RuleType.AutoLink,
      timing: RuleTiming.CreateUpdate,
      configuration: {attribute1: 'a0', attribute2: 'a1', linkType: '12234', collection1: 'c1', collection2: 'c2'},
    },
  ];

  public ruleNames = this.rules.map(r => r.name);

  public addingRules: Rule[] = [];

  constructor(private store$: Store<AppState>) {}

  public ngOnInit(): void {
    this.collection$ = this.store$.select(selectCollectionByWorkspace);
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
}
