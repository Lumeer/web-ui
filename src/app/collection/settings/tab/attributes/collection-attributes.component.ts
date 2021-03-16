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

import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {AppState} from '../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {CollectionAttributesTableComponent} from './table/collection-attributes-table.component';
import {ModalService} from '../../../../shared/modal/modal.service';

@Component({
  templateUrl: './collection-attributes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionAttributesComponent implements OnInit {
  @ViewChild(CollectionAttributesTableComponent)
  public tableComponent: CollectionAttributesTableComponent;

  public collection$: Observable<Collection>;

  private collection: Collection;

  constructor(
    private notificationService: NotificationService,
    private modalService: ModalService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit(): void {
    this.collection$ = this.store$.pipe(
      select(selectCollectionByWorkspace),
      tap(collection => (this.collection = collection))
    );
  }

  public setDefaultAttribute(attribute: Attribute) {
    if (this.collection?.defaultAttributeId !== attribute.id) {
      this.store$.dispatch(
        new CollectionsAction.SetDefaultAttribute({collectionId: this.collection.id, attributeId: attribute.id})
      );
    }
  }

  public onCreateAttribute(name: string) {
    if (this.collection) {
      const attribute = {name, usageCount: 0};
      this.store$.dispatch(
        new CollectionsAction.CreateAttributes({collectionId: this.collection.id, attributes: [attribute]})
      );
    }
  }

  public onNewAttributeName(data: {attribute: Attribute; newName: string}) {
    if (!data.newName) {
      this.showAttributeDeleteDialog(data.attribute, () => {
        this.tableComponent?.resetAttributeName(data.attribute);
      });
    } else {
      const updatedAttribute = {...data.attribute, name: data.newName};
      this.store$.dispatch(
        new CollectionsAction.ChangeAttribute({
          collectionId: this.collection.id,
          attributeId: data.attribute.id,
          attribute: updatedAttribute,
        })
      );
    }
  }

  public onDeleteAttribute(attribute: Attribute) {
    this.showAttributeDeleteDialog(attribute);
  }

  public showAttributeDeleteDialog(attribute: Attribute, onCancel?: () => void) {
    const title = $localize`:@@collection.tab.attributes.delete.title:Delete attribute?`;
    const message = $localize`:@@collection.tab.attributes.delete.message:Do you really want to delete attribute "${attribute.name}:name:"?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteAttribute(attribute), onCancel);
  }

  public deleteAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.RemoveAttribute({collectionId: this.collection.id, attributeId: attribute.id})
    );
  }

  public onAttributeFunction(attribute: Attribute) {
    this.modalService.showAttributeFunction(attribute.id, this.collection.id);
  }

  public onAttributeType(attribute: Attribute) {
    this.modalService.showAttributeType(attribute.id, this.collection.id);
  }
}
