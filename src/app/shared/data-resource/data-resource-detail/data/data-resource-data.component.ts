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
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChange,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {Attribute} from '../../../../core/store/collections/collection';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DataRow, DataRowService} from '../../../data/data-row.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {DataResourceDataRowComponent} from './row/data-resource-data-row.component';
import {filterUnusedAttributes} from '../../../utils/attribute.utils';
import {HiddenInputComponent} from '../../../input/hidden-input/hidden-input.component';
import {DataRowFocusService} from '../../../data/data-row-focus-service';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {selectDocumentById} from '../../../../core/store/documents/documents.state';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {selectLinkTypeById} from '../../../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../../../core/store/link-instances/link-instances.state';
import {ResourceAttributeSettings} from '../../../../core/store/views/view';

@Component({
  selector: 'data-resource-data',
  templateUrl: './data-resource-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataRowService],
})
export class DataResourceDataComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Input()
  public workspace: Workspace;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Input()
  public preventEventBubble: boolean;

  @Input()
  public editableKeys = false;

  @Input()
  public attributeSettings: ResourceAttributeSettings[];

  @Output()
  public attributeTypeClick = new EventEmitter<Attribute>();

  @Output()
  public attributeFunctionCLick = new EventEmitter<Attribute>();

  @ViewChildren(DataResourceDataRowComponent)
  public rows: QueryList<DataResourceDataRowComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  @Output()
  public switchToTable = new EventEmitter();

  @Output()
  public removeDocument = new EventEmitter();

  @Output()
  public dataResourceChanged = new EventEmitter<DataResource>();

  public unusedAttributes$ = new BehaviorSubject<Attribute[]>([]);
  public resource$: Observable<AttributesResource>;
  public dataResource$: Observable<DataResource>;

  private dataRowFocusService: DataRowFocusService;
  private subscriptions = new Subscription();

  constructor(public dataRowService: DataRowService, private store$: Store<AppState>) {
    this.dataRowFocusService = new DataRowFocusService(
      () => 2,
      () => this.dataRowService.rows$.value.length,
      () => this.rows.toArray(),
      () => this.hiddenInputComponent
    );
  }

  public ngOnInit() {
    const subscription = this.dataRowService.rows$.subscribe(rows => {
      const currentDataResource = this.getCurrentDataResource();
      const unusedAttributes = filterUnusedAttributes(
        this.resource && this.resource.attributes,
        currentDataResource && currentDataResource.data
      );
      this.unusedAttributes$.next(unusedAttributes);
      this.dataResourceChanged.emit(currentDataResource);
    });
    this.subscriptions.add(subscription);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.shouldRefreshObservables(changes)) {
      this.dataRowService.init(this.resource, this.dataResource, this.attributeSettings);
      this.resource$ = this.selectResource$();
      this.dataResource$ = this.selectDataResource$();
    } else if (changes.attributesSettings) {
      this.dataRowService.setSettings(this.attributeSettings);
    }
  }

  private selectResource$(): Observable<AttributesResource> {
    if (this.resourceType === AttributesResourceType.Collection) {
      return this.store$.pipe(select(selectCollectionById(this.resource.id)));
    }
    return this.store$.pipe(select(selectLinkTypeById(this.resource.id)));
  }

  private selectDataResource$(): Observable<DataResource> {
    if (!this.dataResource.id) {
      return of(this.dataResource);
    }
    if (this.resourceType === AttributesResourceType.Collection) {
      return this.store$.pipe(select(selectDocumentById(this.dataResource.id)));
    }
    return this.store$.pipe(select(selectLinkInstanceById(this.dataResource.id)));
  }

  private shouldRefreshObservables(changes: SimpleChanges): boolean {
    if (this.resource && this.dataResource) {
      if (this.dataResource.id) {
        return this.objectChanged(changes.resource) || this.objectChanged(changes.dataResource);
      } else {
        return !!changes.resource || !!changes.dataResource;
      }
    }
    return false;
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue.id);
  }

  public onNewKey(value: string, index: number) {
    this.dataRowService.updateRow(index, value);
  }

  public onNewValue(value: any, row: DataRow, index: number) {
    this.dataRowService.updateRow(index, null, value);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.dataRowService.destroy();
  }

  public onRemoveRow(index: number) {
    this.dataRowService.deleteRow(index);
  }

  public onAttributeFunction(row: DataRow) {
    if (row.attribute) {
      this.attributeFunctionCLick.emit(row.attribute);
    }
  }

  public onAttributeType(row: DataRow) {
    if (row.attribute) {
      this.attributeTypeClick.emit(row.attribute);
    }
  }

  public onFocus(row: number, column: number) {
    this.dataRowFocusService.focus(row, this.editableKeys ? column : 1);
  }

  public onResetFocusAndEdit(row: number, column: number) {
    this.dataRowFocusService.resetFocusAndEdit(row, this.editableKeys ? column : 1);
  }

  public onEdit(row: number, column: number) {
    this.dataRowFocusService.edit(row, this.editableKeys ? column : 1);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    this.dataRowFocusService.onKeyDown(event, {column: !this.editableKeys});
  }

  public trackByRow(index: number, row: DataRow): string {
    return row.id;
  }

  public onNewHiddenInput(value: string) {
    this.dataRowFocusService.newHiddenInput(value);
  }

  private getCurrentDataResource(): DataResource {
    if (!this.dataResource) {
      return null;
    }

    const rows = this.dataRowService.rows$.value;

    const data = rows
      .filter(row => row.attribute && row.attribute.id)
      .reduce((d, row) => {
        if (row.attribute.constraint) {
          d[row.attribute.id] = row.attribute.constraint.createDataValue(row.value, this.constraintData).serialize();
        } else {
          d[row.attribute.id] = row.value;
        }
        return d;
      }, {});

    const currentAttributeNames = (this.resource && this.resource.attributes).map(attr => attr.name);
    const newData = rows
      .filter(row => row.key && (!row.attribute || !row.attribute.id) && !currentAttributeNames.includes(row.key))
      .reduce(
        (d, row) => ({
          ...d,
          [row.key]: row.value,
        }),
        {}
      );

    return {...this.dataResource, data, newData};
  }
}
