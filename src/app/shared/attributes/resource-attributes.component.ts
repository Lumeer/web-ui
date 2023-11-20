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
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';

import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType} from '../../core/model/resource';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {
  selectCollectionPermissions,
  selectLinkTypePermissions,
} from '../../core/store/user-permissions/user-permissions.state';
import {ModalService} from '../modal/modal.service';
import {objectChanged} from '../utils/common.utils';
import {ResourceAttributesTableComponent} from './table/resource-attributes-table.component';

@Component({
  selector: 'resource-attributes',
  templateUrl: './resource-attributes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceAttributesComponent implements OnChanges {
  @ViewChild(ResourceAttributesTableComponent)
  public tableComponent: ResourceAttributesTableComponent;

  @Input()
  public resource: AttributesResource;

  @Input()
  public attributesResourceType: AttributesResourceType;

  public permissions$: Observable<AllowedPermissions>;

  constructor(
    private notificationService: NotificationService,
    private modalService: ModalService,
    private store$: Store<AppState>
  ) {}

  public get collectionId(): string {
    return this.attributesResourceType === AttributesResourceType.Collection ? this.resource?.id : null;
  }

  public get linkTypeId(): string {
    return this.attributesResourceType === AttributesResourceType.LinkType ? this.resource?.id : null;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource && objectChanged(changes.resource)) {
      this.setupPermissions();
    }
  }

  public setupPermissions() {
    if (this.attributesResourceType === AttributesResourceType.Collection) {
      this.permissions$ = this.store$.pipe(select(selectCollectionPermissions(this.collectionId)));
    } else if (this.attributesResourceType === AttributesResourceType.LinkType) {
      this.permissions$ = this.store$.pipe(select(selectLinkTypePermissions(this.linkTypeId)));
    }
  }

  public setDefaultAttribute(attribute: Attribute) {
    if (this.attributesResourceType === AttributesResourceType.Collection) {
      const collection = <Collection>this.resource;
      if (collection?.defaultAttributeId !== attribute.id) {
        this.store$.dispatch(
          new CollectionsAction.SetDefaultAttribute({collectionId: this.collectionId, attributeId: attribute.id})
        );
      }
    }
  }

  public onCreateAttribute(name: string) {
    const attribute = {name, usageCount: 0};
    if (this.attributesResourceType === AttributesResourceType.Collection) {
      this.store$.dispatch(
        new CollectionsAction.CreateAttributes({collectionId: this.collectionId, attributes: [attribute]})
      );
    } else if (this.attributesResourceType === AttributesResourceType.LinkType) {
      this.store$.dispatch(
        new LinkTypesAction.CreateAttributes({linkTypeId: this.linkTypeId, attributes: [attribute]})
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
      if (this.attributesResourceType === AttributesResourceType.Collection) {
        this.store$.dispatch(
          new CollectionsAction.ChangeAttribute({
            collectionId: this.collectionId,
            attributeId: data.attribute.id,
            attribute: updatedAttribute,
          })
        );
      } else if (this.attributesResourceType === AttributesResourceType.LinkType) {
        this.store$.dispatch(
          new LinkTypesAction.UpdateAttribute({
            linkTypeId: this.linkTypeId,
            attributeId: data.attribute.id,
            attribute: updatedAttribute,
          })
        );
      }
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
    if (this.attributesResourceType === AttributesResourceType.Collection) {
      this.store$.dispatch(
        new CollectionsAction.RemoveAttribute({collectionId: this.collectionId, attributeId: attribute.id})
      );
    } else if (this.attributesResourceType === AttributesResourceType.LinkType) {
      this.store$.dispatch(
        new LinkTypesAction.DeleteAttribute({linkTypeId: this.linkTypeId, attributeId: attribute.id})
      );
    }
  }

  public onAttributeFunction(attribute: Attribute) {
    this.modalService.showAttributeFunction(attribute.id, this.collectionId, this.linkTypeId);
  }

  public onAttributeType(attribute: Attribute) {
    this.modalService.showAttributeType(attribute.id, this.collectionId, this.linkTypeId);
  }
}
