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

import {Workspace} from '../../core/store/navigation/workspace';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

export abstract class ToggleService<T> {
  private pendingUpdates: Record<string, boolean> = {};
  private pendingUpdatesData: Record<string, T> = {};
  private pendingSubscriptions: Record<string, Subscription> = {};
  protected workspace: Workspace;

  public setWorkspace(workspace: Workspace) {
    this.workspace = workspace;
  }

  public set(id: string, active: boolean, data?: T) {
    this.processToggleToStore(id, active, data);

    if (this.pendingUpdates[id]) {
      if (this.pendingUpdates[id] !== active) {
        this.unsubscribePendingUpdate(id);
      }
    } else {
      const subject = new Subject<string>();
      const subscription = subject.pipe(debounceTime(2000)).subscribe(() => {
        this.processToggle(id, active, data);
        this.unsubscribePendingUpdate(id);
      });
      this.pendingUpdates[id] = active;
      this.pendingUpdatesData[id] = data;
      this.pendingSubscriptions[id] = subscription;
      subject.next('');
    }
  }

  private unsubscribePendingUpdate(id: string) {
    delete this.pendingUpdates[id];
    delete this.pendingUpdatesData[id];
    this.pendingSubscriptions[id] && this.pendingSubscriptions[id].unsubscribe();
    delete this.pendingSubscriptions[id];
  }

  public onDestroy() {
    Object.keys(this.pendingUpdates).forEach(id =>
      this.processToggle(id, this.pendingUpdates[id], this.pendingUpdatesData[id])
    );
    Object.values(this.pendingSubscriptions).forEach(subject => subject.unsubscribe());
    this.pendingUpdates = {};
    this.pendingUpdatesData = {};
    this.pendingSubscriptions = {};
    this.workspace = null;
  }

  public abstract processToggle(id: string, active: boolean, data?: T);

  public abstract processToggleToStore(id: string, active: boolean, data?: T);
}
