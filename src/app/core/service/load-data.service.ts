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
import {Query} from '../store/navigation/query/query';
import {Injectable} from '@angular/core';
import {AppState} from '../store/app.state';
import {Store} from '@ngrx/store';
import {DataResourcesAction} from '../store/data-resources/data-resources.action';
import {DocumentsAction} from '../store/documents/documents.action';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';
import {Workspace} from '../store/navigation/workspace';
import {WorkspaceQuery} from '../store/navigation/query/workspace-query';
import {workspaceQueriesAreSame} from '../store/navigation/query/query.util';

@Injectable()
export class LoadDataService {
  private tasksQueries: WorkspaceQuery[] = [];
  private dataResourcesQueries: WorkspaceQuery[] = [];
  private documentsQueries: WorkspaceQuery[] = [];
  private linkInstancesQueries: WorkspaceQuery[] = [];

  constructor(private store$: Store<AppState>) {}

  public getTasksQueries(): WorkspaceQuery[] {
    return [...this.tasksQueries];
  }

  public getDataResourcesQueries(): WorkspaceQuery[] {
    return [...this.dataResourcesQueries];
  }

  public getDocumentsQueries(): WorkspaceQuery[] {
    return [...this.documentsQueries];
  }

  public getLinkInstancesQueries(): WorkspaceQuery[] {
    return [...this.linkInstancesQueries];
  }

  public setTasksQueries(queries: Query[], workspace?: Workspace) {
    this.tasksQueries = addWorkspaceToQueries(queries, workspace);
    this.loadTasksQueries();
  }

  private loadTasksQueries(force?: boolean) {
    this.tasksQueries.forEach(query =>
      this.store$.dispatch(
        new DataResourcesAction.GetTasks({
          query,
          force,
          workspace: query.workspace,
        })
      )
    );
  }

  public setDocumentsQueries(queries: Query[], workspace?: Workspace) {
    this.documentsQueries = addWorkspaceToQueries(queries, workspace);
    this.loadDocumentsQueries();
  }

  private loadDocumentsQueries(force?: boolean) {
    this.documentsQueries.forEach(query =>
      this.store$.dispatch(
        new DocumentsAction.Get({
          query,
          force,
          workspace: query.workspace,
        })
      )
    );
  }

  public setDataResourcesQueries(queries: Query[], workspace?: Workspace) {
    this.dataResourcesQueries = addWorkspaceToQueries(queries, workspace);
    this.loadDataResourcesQueries();
  }

  public addDataResourcesQueries(queries: Query[], workspace?: Workspace) {
    this.dataResourcesQueries = [...addWorkspaceToQueries(queries, workspace), ...this.dataResourcesQueries];
    this.loadDataResourcesQueries();
  }

  public clearDataResourcesQueries() {
    this.dataResourcesQueries = [];
  }

  private loadDataResourcesQueries(force?: boolean) {
    this.dataResourcesQueries.forEach(query =>
      this.store$.dispatch(
        new DataResourcesAction.Get({
          query,
          force,
          workspace: query.workspace,
        })
      )
    );
  }

  public setLinkInstancesQueries(queries: Query[], workspace?: Workspace) {
    this.linkInstancesQueries = addWorkspaceToQueries(queries, workspace);
    this.loadLinkInstancesQueries();
  }

  public clearLinkInstancesQueries() {
    this.linkInstancesQueries = [];
  }

  private loadLinkInstancesQueries(force?: boolean) {
    this.linkInstancesQueries.forEach(query =>
      this.store$.dispatch(
        new LinkInstancesAction.Get({
          query,
          force,
          workspace: query.workspace,
        })
      )
    );
  }

  public destroy() {
    factory.removeInstance(this);
  }
}

function addWorkspaceToQueries(queries: Query[], workspace: Workspace): WorkspaceQuery[] {
  return (queries || []).map(query => ({...query, workspace}));
}

export const LoadDataServiceProvider = {
  provide: LoadDataService,
  useFactory: (store$: Store<AppState>) => factory.create(store$),
  deps: [Store],
};

class LoadDataServiceFactory {
  private instances: LoadDataService[] = [];

  public getInstances(): LoadDataService[] {
    return [...this.instances];
  }

  public create(store$: Store<AppState>) {
    const instance = new LoadDataService(store$);
    this.instances.push(instance);
    return instance;
  }

  public removeInstance(instance: LoadDataService) {
    const index = this.instances.indexOf(instance);
    if (index !== -1) {
      this.instances.splice(index, 1);
    }
  }
}

const factory = new LoadDataServiceFactory();

export function getCurrentDocumentsQueries(): WorkspaceQuery[] {
  return filterUniqueWorkspaceQueries(
    factory.getInstances().reduce((queries, instance) => [...queries, ...instance.getDocumentsQueries()], [])
  );
}

export function getCurrentTasksQueries(): WorkspaceQuery[] {
  return filterUniqueWorkspaceQueries(
    factory.getInstances().reduce((queries, instance) => [...queries, ...instance.getTasksQueries()], [])
  );
}

export function getCurrentLinkInstancesQueries(): WorkspaceQuery[] {
  return filterUniqueWorkspaceQueries(
    factory.getInstances().reduce((queries, instance) => [...queries, ...instance.getLinkInstancesQueries()], [])
  );
}

export function getCurrentDataResourcesQueries(): WorkspaceQuery[] {
  return filterUniqueWorkspaceQueries(
    factory.getInstances().reduce((queries, instance) => [...queries, ...instance.getDataResourcesQueries()], [])
  );
}

function filterUniqueWorkspaceQueries(queries: WorkspaceQuery[]): WorkspaceQuery[] {
  return queries.reduce((uniqueQueries, query) => {
    if (!uniqueQueries.some(q => workspaceQueriesAreSame(q, query))) {
      uniqueQueries.push(query);
    }
    return uniqueQueries;
  }, []);
}
