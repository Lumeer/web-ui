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
  OnDestroy,
  Output,
  QueryList,
  SimpleChange,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {ConstraintData} from '../../core/model/data/constraint';
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
import {Store} from '@ngrx/store';
import {getAttributesResourceType} from '../utils/resource.utils';
import {DocumentModel} from '../../core/store/documents/document.model';
import {HiddenInputComponent} from '../input/hidden-input/hidden-input.component';
import {ModalService} from '../modal/modal.service';

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
export class PostItComponent implements OnDestroy {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public tag: PostItTag;

  @Input()
  public query: Query;

  @Input()
  public canDrag: boolean;

  @Output()
  public toggleFavorite = new EventEmitter();

  @ViewChildren(PostItRowComponent)
  public rows: QueryList<PostItRowComponent>;

  @ViewChild(HiddenInputComponent, {static: false})
  public hiddenInputComponent: HiddenInputComponent;

  public unusedAttributes: Attribute[] = [];

  private dataRowFocusService: DataRowFocusService;

  public resourceType: AttributesResourceType;

  constructor(
    public dataRowService: DataRowService,
    private store$: Store<AppState>,
    private modalService: ModalService
  ) {
    this.dataRowFocusService = new DataRowFocusService(
      () => 2,
      () => this.dataRowService.rows$.value.length,
      () => this.rows.toArray(),
      () => this.hiddenInputComponent
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.resourceType = getAttributesResourceType(this.resource);
    if (this.objectChanged(changes.resource) || this.objectChanged(changes.dataResource)) {
      if (this.resource && this.dataResource) {
        this.dataRowService.init(this.resource, this.dataResource);
      }
    }
    if (changes.resource || changes.dataResource) {
      this.unusedAttributes = filterUnusedAttributes(
        this.resource && this.resource.attributes,
        this.dataResource && this.dataResource.data
      );
    }
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
    this.dataRowService.destroy();
  }

  public onRemoveRow(index: number) {
    this.dataRowService.deleteRow(index);
  }

  public onCreateRow() {
    this.dataRowService.addRow();
  }

  public onFocus(row: number, column: number) {
    this.dataRowFocusService.focus(row, column);
  }

  public onResetFocusAndEdit(row: number, column: number) {
    this.dataRowFocusService.resetFocusAndEdit(row, column);
  }

  public onEdit(row: number, column: number) {
    this.dataRowFocusService.edit(row, column);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    this.dataRowFocusService.onKeyDown(event);
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
    }
  }

  public onDetail() {
    if (getAttributesResourceType(this.resource) === AttributesResourceType.Collection) {
      this.modalService.showDocumentDetail(this.dataResource as DocumentModel, this.resource);
    }
  }
}
