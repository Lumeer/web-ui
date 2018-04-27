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

import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../core/store/app.state';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../../core/store/navigation/query.model';
import {QueryHelper} from './query-helper';
import {WorkspaceHelper} from './workspace-helper';

export class NavigationHelper {

  private subscription: Subscription;

  private queryHelper: QueryHelper;

  private workspaceHelper: WorkspaceHelper;

  private changeCallback: () => void = () => null;

  private validNavigationCallback: () => void = () => null;

  constructor(private store: Store<AppState>, private getDocumentsPerRow: () => number) {
  }

  public onChange(callback: () => void): void {
    this.changeCallback = callback;
  }

  public onValidNavigation(callback: () => void): void {
    this.validNavigationCallback = callback;
  }

  private callCallback(): void {
    this.changeCallback();

    if (this.validNavigation()) {
      this.validNavigationCallback();
    }
  }

  public initialize(): void {
    this.subscription = this.store.select(selectNavigation).subscribe(navigation => {
      this.workspaceHelper = new WorkspaceHelper(navigation.workspace);
      this.queryHelper = new QueryHelper(navigation.query, this.getDocumentsPerRow);

      this.callCallback();
    });
  }

  public queryWithPagination(page: number): QueryModel {
    return this.queryHelper.queryWithPagination(page);
  }

  public validNavigation(): boolean {
    return Boolean(
      this.workspaceHelper &&
      this.workspaceHelper.hasWorkspace() &&
      this.queryHelper &&
      this.queryHelper.hasQuery()
    );
  }

  public unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
