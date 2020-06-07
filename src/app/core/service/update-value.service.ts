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

import {Workspace} from '../store/navigation/workspace';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

export abstract class UpdateValueService<V, T> {
  private pendingUpdates: Record<string, V> = {};
  private pendingUpdatesData: Record<string, T> = {};
  private pendingSubscriptions: Record<string, Subscription> = {};
  private pendingSubjects: Record<string, Subject<any>> = {};
  protected workspace: Workspace;

  constructor(private dueTime: number = 2000) {}

  public setWorkspace(workspace: Workspace) {
    this.workspace = workspace;
  }

  public set(id: string, value: V, data?: T) {
    this.processUpdateToStore(id, value, data);

    if (this.pendingUpdates[id]) {
      if (this.shouldUnsubscribePendingUpdate(this.pendingUpdates[id], value)) {
        this.unsubscribePendingUpdate(id);
      } else {
        this.pendingUpdates[id] = value;
        this.pendingUpdatesData[id] = data;
        this.pendingSubjects[id]?.next('');
      }
    } else {
      const subject = new Subject<any>();
      const subscription = subject.pipe(debounceTime(this.dueTime)).subscribe(() => {
        this.processUpdate(id, this.pendingUpdates[id], this.pendingUpdatesData[id]);
        this.unsubscribePendingUpdate(id);
      });
      this.pendingUpdates[id] = value;
      this.pendingUpdatesData[id] = data;
      this.pendingSubscriptions[id] = subscription;
      this.pendingSubjects[id] = subject;
      subject.next('');
    }
  }

  private unsubscribePendingUpdate(id: string) {
    delete this.pendingUpdates[id];
    delete this.pendingUpdatesData[id];
    this.pendingSubscriptions[id]?.unsubscribe();
    delete this.pendingSubscriptions[id];
    delete this.pendingSubjects[id];
  }

  public onDestroy() {
    Object.keys(this.pendingUpdates).forEach(id =>
      this.processUpdate(id, this.pendingUpdates[id], this.pendingUpdatesData[id])
    );
    Object.values(this.pendingSubscriptions).forEach(subject => subject.unsubscribe());
    this.pendingUpdates = {};
    this.pendingUpdatesData = {};
    this.pendingSubscriptions = {};
    this.pendingSubjects = {};
    this.workspace = null;
  }

  public abstract shouldUnsubscribePendingUpdate(previousValue: V, currentValue: V): boolean;

  public abstract processUpdate(id: string, value: V, data?: T);

  public abstract processUpdateToStore(id: string, value: V, data?: T);
}
