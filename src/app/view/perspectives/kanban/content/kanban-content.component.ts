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
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';

import {Store} from '@ngrx/store';

import {BehaviorSubject, Subscription} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';

import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';

import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {AppState} from '../../../../core/store/app.state';
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanColumn, KanbanConfig} from '../../../../core/store/kanbans/kanban';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {User} from '../../../../core/store/users/user';
import {ViewSettings} from '../../../../core/store/view-settings/view-settings';
import {View} from '../../../../core/store/views/view';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {moveItemInArray} from '../../../../shared/utils/array.utils';
import {KanbanPerspectiveConfiguration} from '../../perspective-configuration';
import {KanbanConverter} from '../util/kanban-converter';
import {KanbanData, KanbanDataColumn} from '../util/kanban-data';
import {checkOrTransformKanbanConfig, isKanbanConfigChanged} from '../util/kanban.util';

interface Data {
  collections: Collection[];
  linkTypes: LinkType[];
  data: DocumentsAndLinksData;
  config: KanbanConfig;
  constraintData: ConstraintData;
  permissions: ResourcesPermissions;
  query: Query;
  settings: ViewSettings;
}

@Component({
  selector: 'kanban-content',
  templateUrl: './kanban-content.component.html',
  styleUrls: ['./kanban-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanContentComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collections: Collection[];

  @Input()
  public config: KanbanConfig;

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public sidebarOpened: boolean;

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public workspace: Workspace;

  @Input()
  public settings: ViewSettings;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public currentUser: User;

  @Input()
  public perspectiveConfiguration: KanbanPerspectiveConfiguration;

  @Output()
  public configChange = new EventEmitter<KanbanConfig>();

  @Output()
  public sidebarToggle = new EventEmitter();

  private readonly converter: KanbanConverter;

  public data$ = new BehaviorSubject<KanbanData>(null);

  private dataSubject = new BehaviorSubject<Data>(null);
  private subscriptions = new Subscription();
  private currentConfig: KanbanConfig;

  constructor(
    private store$: Store<AppState>,
    private constraintItemsFormatter: SelectItemWithConstraintFormatter
  ) {
    this.converter = new KanbanConverter(constraintItemsFormatter);
  }

  public ngOnInit() {
    this.subscribeData();
  }

  private subscribeData() {
    const subscription = this.dataSubject
      .pipe(
        filter(data => !!data),
        debounceTime(100),
        map(data => this.handleData(data))
      )
      .subscribe(data => {
        this.currentConfig = data.config;
        this.configChange.emit(data.config);
        this.data$.next(data.data);
      });

    this.subscriptions.add(subscription);
  }

  private handleData(data: Data): {config: KanbanConfig; data: KanbanData} {
    const transformedConfig = checkOrTransformKanbanConfig(data.config, data.query, data.collections, data.linkTypes);

    return this.converter.convert(
      transformedConfig,
      data.collections,
      data.linkTypes,
      data.data,
      data.permissions,
      data.settings,
      data.constraintData
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.shouldConvertData(changes)) {
      this.rebuildConfig(this.config);
    }
  }

  private shouldConvertData(changes: SimpleChanges): boolean {
    return (
      (changes.data ||
        (changes.config && this.configChanged(changes.config)) ||
        changes.collections ||
        changes.linkTypes ||
        changes.query ||
        changes.settings ||
        changes.permissions ||
        changes.constraintData) &&
      !!this.config
    );
  }

  private configChanged(change: SimpleChange): boolean {
    return change.currentValue && isKanbanConfigChanged(this.currentConfig, change.currentValue);
  }

  public onConfigChanged(config: KanbanConfig, rebuild = false) {
    if (rebuild) {
      this.rebuildConfig(config);
    } else {
      this.currentConfig = config;
      this.configChange.emit(config);
    }
  }

  private rebuildConfig(config: KanbanConfig) {
    this.dataSubject.next({
      config,
      collections: this.collections,
      linkTypes: this.linkTypes,
      data: this.data,
      query: this.query,
      constraintData: this.constraintData,
      permissions: this.permissions,
      settings: this.settings,
    });
  }

  public onColumnMoved(event: {previousIndex: number; currentIndex: number}) {
    this.handleDataColumnsMove(event);
    this.handleConfigColumnsMove(event);
  }

  private handleDataColumnsMove(event: {previousIndex: number; currentIndex: number}) {
    const columns = moveItemInArray(this.data$.value.columns, event.previousIndex, event.currentIndex);
    this.data$.next({...this.data$.value, columns});
  }

  private handleConfigColumnsMove(event: {previousIndex: number; currentIndex: number}) {
    const columns = moveItemInArray(this.config.columns, event.previousIndex, event.currentIndex);
    this.onConfigChanged({...this.config, columns});
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onColumnRemove(column: KanbanColumn) {
    this.handleDataColumnRemove(column);
    this.handleConfigColumnRemove(column);
  }

  private handleDataColumnRemove(column: KanbanColumn) {
    const filteredColumns = (this.data$.value.columns || []).filter(col => col.id !== column.id);
    const newData = {...this.data$.value, columns: filteredColumns};
    this.data$.next(newData);
  }

  private handleConfigColumnRemove(column: KanbanColumn) {
    const filteredColumns = (this.config.columns || []).filter(col => col.id !== column.id);
    const config = {...this.config, columns: filteredColumns};
    this.onConfigChanged(config);
  }

  public onColumnsChanged(data: {columns: KanbanDataColumn[]; otherColumn: KanbanDataColumn}) {
    this.data$.next({...this.data$.value, ...data});
  }
}
