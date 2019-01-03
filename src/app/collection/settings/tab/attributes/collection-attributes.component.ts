/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {AppState} from '../../../../core/store/app.state';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {InputBoxComponent} from '../../../../shared/input/input-box/input-box.component';

@Component({
  templateUrl: './collection-attributes.component.html',
  styleUrls: ['./collection-attributes.component.scss'],
})
export class CollectionAttributesComponent implements OnInit, OnDestroy {
  public collection: CollectionModel;
  public attributes: AttributeModel[] = [];
  public searchString: string;
  public attributePlaceholder: string;
  public newAttributeName: string;

  private collectionSubscription = new Subscription();

  constructor(private i18n: I18n, private notificationService: NotificationService, private store: Store<AppState>) {}

  public ngOnInit(): void {
    this.subscribeData();
    this.translatePlaceholders();
  }

  public ngOnDestroy() {
    this.collectionSubscription.unsubscribe();
  }

  public setDefaultAttribute(attribute: AttributeModel) {
    if (this.collection.defaultAttributeId === attribute.id) {
      return;
    }
    this.store.dispatch(
      new CollectionsAction.SetDefaultAttribute({collectionId: this.collection.id, attributeId: attribute.id})
    );
  }

  public onCreateAttribute() {
    const name = this.newAttributeName.trim();
    if (name === '') {
      return;
    }
    const attribute = {name, usageCount: 0};
    this.store.dispatch(
      new CollectionsAction.CreateAttributes({collectionId: this.collection.id, attributes: [attribute]})
    );

    this.newAttributeName = '';
  }

  public isDefaultAttribute(attribute: AttributeModel): boolean {
    return attribute.id === this.getDefaultAttributeId();
  }

  private getDefaultAttributeId(): string {
    return getDefaultAttributeId(this.collection);
  }

  public onNewAttributeName(component: InputBoxComponent, attribute: AttributeModel, newName: string) {
    if (newName === '') {
      this.showAttributeDeleteDialog(attribute, () => {
        component.setValue(attribute.name);
      });
    } else {
      const updatedAttribute = {...attribute, name: newName};
      this.store.dispatch(
        new CollectionsAction.ChangeAttribute({
          collectionId: this.collection.id,
          attributeId: attribute.id,
          attribute: updatedAttribute,
        })
      );
    }
  }

  public onDeleteAttribute(attribute: AttributeModel) {
    this.showAttributeDeleteDialog(attribute);
  }

  public showAttributeDeleteDialog(attribute: AttributeModel, onCancel?: () => void) {
    const title = this.i18n({id: 'collection.tab.attributes.delete.title', value: 'Delete attribute?'});
    const message = this.i18n(
      {id: 'collection.tab.attributes.delete.message', value: 'Do you really want to delete attribute "{{name}}"?'},
      {
        name: attribute.name,
      }
    );
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText, action: onCancel},
      {text: yesButtonText, action: () => this.deleteAttribute(attribute), bold: false},
    ]);
  }

  public deleteAttribute(attribute: AttributeModel) {
    this.store.dispatch(
      new CollectionsAction.RemoveAttribute({collectionId: this.collection.id, attributeId: attribute.id})
    );
  }

  public trackByAttributeId(index: number, attribute: AttributeModel) {
    return attribute.id;
  }

  private subscribeData() {
    this.collectionSubscription.add(
      this.store
        .select(selectCollectionByWorkspace)
        .pipe(filter(collection => !isNullOrUndefined(collection)))
        .subscribe(collection => {
          this.collection = collection;
          this.attributes = this.collection.attributes.slice();
        })
    );
  }

  private translatePlaceholders() {
    this.attributePlaceholder = this.i18n({
      id: 'collection.tab.attributes.attribute.placeholder',
      value: 'Enter attribute name.',
    });
  }

  public valueChanged($event) {
    this.newAttributeName = $event.target.value;
  }
}
