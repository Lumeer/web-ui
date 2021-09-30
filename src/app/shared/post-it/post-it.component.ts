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
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, DataResource} from '../../core/model/resource';
import {DataRow, DataRowService} from '../data/data-row.service';
import {filterUnusedAttributes} from '../utils/attribute.utils';
import {Attribute} from '../../core/store/collections/collection';
import {DataRowFocusService} from '../data/data-row-focus-service';
import {PostItRowComponent} from './row/post-it-row.component';
import {Query} from '../../core/store/navigation/query/query';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {AppState} from '../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {getAttributesResourceType} from '../utils/resource.utils';
import {DocumentModel} from '../../core/store/documents/document.model';
import {HiddenInputComponent} from '../input/hidden-input/hidden-input.component';
import {ModalService} from '../modal/modal.service';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {PostItLayoutType} from './post-it-layout-type';
import {ResourceAttributeSettings} from '../../core/store/views/view';
import {fromEvent, Observable, Subscription} from 'rxjs';
import {objectChanged} from '../utils/common.utils';
import {ConstraintData} from '@lumeer/data-filters';
import {User} from '../../core/store/users/user';
import {selectCurrentUser} from '../../core/store/users/users.state';

export interface PostItTag {
  title: string;
  color: string;
}

@Component({
  selector: 'post-it',
  templateUrl: './post-it.component.html',
  styleUrls: ['./post-it.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataRowService],
  host: {class: 'card'},
})
export class PostItComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public viewId: string;

  @Input()
  public tag: PostItTag;

  @Input()
  public layoutType: PostItLayoutType;

  @Input()
  public query: Query;

  @Input()
  public canDrag: boolean;

  @Input()
  public editableKeys = false;

  @Input()
  public attributesSettings: ResourceAttributeSettings[];

  @Output()
  public toggleFavorite = new EventEmitter();

  @ViewChildren(PostItRowComponent)
  public rows: QueryList<PostItRowComponent>;

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  public currentUser$: Observable<User>;

  public unusedAttributes: Attribute[] = [];
  public resourceType: AttributesResourceType;

  private dataRowFocusService: DataRowFocusService;
  private subscriptions = new Subscription();

  constructor(
    public dataRowService: DataRowService,
    private store$: Store<AppState>,
    private modalService: ModalService
  ) {
    this.dataRowFocusService = new DataRowFocusService(
      () => 2,
      () => this.dataRowService.rows$.value.length,
      () => this.rows.toArray(),
      () => this.hiddenInputComponent,
      (row, column) => this.dataRowService.rows$.value[row]?.attribute?.constraint?.isDirectlyEditable
    );
  }

  public ngOnInit() {
    const subscription = fromEvent(document, 'keydown').subscribe(event => {
      this.dataRowFocusService.onKeyDown(event as KeyboardEvent, {column: !this.editableKeys});
    });
    this.subscriptions.add(subscription);
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.resource) || objectChanged(changes.dataResource)) {
      if (this.resource && this.dataResource) {
        this.dataRowService.init(this.resource, this.dataResource, this.attributesSettings);
      }
    } else if (changes.attributesSettings) {
      this.dataRowService.setSettings(this.attributesSettings);
    }
    if (changes.resource) {
      this.resourceType = getAttributesResourceType(this.resource);
    }
    if (changes.resource || changes.dataResource) {
      this.unusedAttributes = filterUnusedAttributes(this.resource?.attributes, this.dataResource?.data);
    }
    if (changes.viewId) {
      this.dataRowService.setWorkspace({viewId: this.viewId});
    }
  }

  public onNewKey(value: string, index: number) {
    this.dataRowService.updateRow(index, value);
  }

  public onNewValue(value: any, row: DataRow, index: number) {
    this.dataRowService.updateRow(index, null, value);
  }

  public ngOnDestroy() {
    this.dataRowService.destroy();
    this.subscriptions.unsubscribe();
  }

  public onRemoveRow(index: number) {
    this.dataRowService.deleteRow(index);
  }

  public onCreateRow() {
    this.dataRowService.addRow();
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

  public trackByRow(index: number, row: DataRow): string {
    return row.id;
  }

  public onNewHiddenInput(value: string) {
    this.dataRowFocusService.newHiddenInput(value);
  }

  public onRemove() {
    if (this.resourceType === AttributesResourceType.Collection) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: (<DocumentModel>this.dataResource).collectionId,
          documentId: this.dataResource.id,
        })
      );
    } else {
      this.store$.dispatch(new LinkInstancesAction.DeleteConfirm({linkInstanceId: this.dataResource.id}));
    }
  }

  public onDetail() {
    this.modalService.showDataResourceDetail(this.dataResource, this.resource, this.viewId);
  }
}
