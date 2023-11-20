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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {SelectDataValue, UserDataValue} from '@lumeer/data-filters';

import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {View} from '../../../../../../core/store/views/view';
import {createViewSelectItems} from '../../../../../../core/store/views/view.utils';
import {UserDataInputConfiguration} from '../../../../../data-input/data-input-configuration';
import {DropdownDirective} from '../../../../../dropdown/dropdown.directive';
import {collectionSelectItems, linkTypesSelectItems} from '../../../../../select/select-item.utils';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {objectValues, preventEvent} from '../../../../../utils/common.utils';
import {AuditLogConfiguration} from '../../model/audit-log-configuration';
import {AuditLogFilters} from '../../model/audit-log-filters';

@Component({
  selector: 'audit-log-filters-dropdown',
  templateUrl: './audit-log-filters-dropdown.component.html',
  styleUrls: ['./audit-log-filters-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogFiltersDropdownComponent extends DropdownDirective implements OnChanges {
  @Input()
  public filters: AuditLogFilters;

  @Input()
  public viewsMap: Record<string, View>;

  @Input()
  public collectionsMap: Record<string, Collection>;

  @Input()
  public linkTypesMap: Record<string, LinkType>;

  @Input()
  public configuration: AuditLogConfiguration;

  @Input()
  public usersDataValue: UserDataValue;

  @Input()
  public typesDataValue: SelectDataValue;

  @Output()
  public filtersChanged = new EventEmitter<AuditLogFilters>();

  public userConfig: UserDataInputConfiguration = {onlyIcon: true};

  public editingUsers$ = new BehaviorSubject(false);
  public editingResources$ = new BehaviorSubject(false);
  public editingTypes$ = new BehaviorSubject(false);
  public editingViews$ = new BehaviorSubject(false);

  public viewSelectItems: SelectItemModel[];
  public resourcesSelectItems: SelectItemModel[];

  private readonly collectionGroupTitle = $localize`:@@collections:Tables`;
  private readonly linkTypesGroupTitle = $localize`:@@linkTypes:Link Types`;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.viewsMap) {
      this.viewSelectItems = createViewSelectItems(objectValues(this.viewsMap));
    }
    if (changes.collectionsMap || changes.linkTypesMap) {
      this.resourcesSelectItems = [
        ...collectionSelectItems(objectValues(this.collectionsMap)).map(item => ({
          ...item,
          group: this.collectionGroupTitle,
        })),
        ...linkTypesSelectItems(objectValues(this.linkTypesMap)).map(item => ({
          ...item,
          group: this.linkTypesGroupTitle,
        })),
      ];
    }
  }

  public onSaveUsers(data: {dataValue: UserDataValue}) {
    this.patchFilters('users', data.dataValue.serialize());
    this.editingUsers$.next(false);
  }

  public onClearUsers(event: MouseEvent) {
    preventEvent(event);
    this.patchFilters('users', []);
  }

  public onClickUsers(event: MouseEvent) {
    preventEvent(event);
    this.editingUsers$.next(true);
  }

  public onCancelUsers() {
    this.editingUsers$.next(false);
  }

  public onSaveTypes(data: {dataValue: SelectDataValue}) {
    this.patchFilters('types', data.dataValue.serialize());
    this.editingTypes$.next(false);
  }

  public onClearTypes(event: MouseEvent) {
    preventEvent(event);
    this.patchFilters('types', []);
  }

  public onClickTypes(event: MouseEvent) {
    preventEvent(event);
    this.editingTypes$.next(true);
  }

  public onCancelTypes() {
    this.editingTypes$.next(false);
  }

  public onSaveResources(ids: string[]) {
    const collections = ids.filter(id => this.collectionsMap?.[id]);
    const linkTypes = ids.filter(id => this.linkTypesMap?.[id]);

    const filtersCopy = {...this.filters, collections, linkTypes};
    this.filtersChanged.emit(filtersCopy);

    this.editingResources$.next(false);
  }

  public onClearResources(event: MouseEvent) {
    preventEvent(event);
    const filtersCopy = {...this.filters, collections: [], linkTypes: []};
    this.filtersChanged.emit(filtersCopy);
  }

  public onClickResources(event: MouseEvent) {
    preventEvent(event);
    this.editingResources$.next(true);
  }

  public onCancelResources() {
    this.editingResources$.next(false);
  }

  public onSaveViews(ids: string[]) {
    this.patchFilters('views', ids);
    this.editingViews$.next(false);
  }

  public onClearViews(event: MouseEvent) {
    preventEvent(event);
    this.patchFilters('views', []);
  }

  public onClickViews(event: MouseEvent) {
    preventEvent(event);
    this.editingViews$.next(true);
  }

  public onCancelViews() {
    this.editingViews$.next(false);
  }

  private patchFilters(key: keyof AuditLogFilters, value: any) {
    const filtersCopy = {...this.filters};
    filtersCopy[key] = value;
    this.filtersChanged.emit(filtersCopy);
  }
}
