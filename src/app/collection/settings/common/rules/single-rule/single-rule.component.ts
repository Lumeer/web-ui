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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Rule, RuleTiming, RuleType} from '../../../../../core/model/rule';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../../../../core/notifications/notification.service';

@Component({
  selector: 'single-rule',
  templateUrl: './single-rule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleRuleComponent {
  @Input()
  public rule: Rule;

  @Output()
  public onEdit = new EventEmitter<string>();

  @Output()
  public onDelete = new EventEmitter<string>();

  constructor(private store$: Store<AppState>, private i18n: I18n) {}

  public fireEdit(rule: Rule): void {
    if (rule.type === RuleType.Zapier) {
      this.showZapierWarning();
    } else {
      this.onEdit.emit(rule.name);
    }
  }

  public fireDelete(rule: Rule): void {
    if (rule.type === RuleType.Zapier) {
      this.showZapierWarning();
    } else {
      this.onDelete.emit(rule.name);
    }
  }

  public showZapierWarning(): void {
    const title = this.i18n({
      id: 'collection.config.tab.rules.zapier.warning.title',
      value: 'Zapier Automation',
    });
    const message = this.i18n({
      id: 'collection.config.tab.rules.zapier.warning.text',
      value: 'This rule is created by a Zap in Zapier. Please configure this rule directly in Zapier (www.zapier.com).',
    });

    this.store$.dispatch(new NotificationsAction.Info({title, message}));
  }
}
