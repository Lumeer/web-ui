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

import {HtmlModifier} from '../../../../shared/utils/html-modifier';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {filter} from 'rxjs/operators';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {isNullOrUndefined} from "util";
import {Subscription} from 'rxjs/Subscription';

@Component({
  templateUrl: './collection-attributes.component.html',
  styleUrls: ['./collection-attributes.component.scss']
})
export class CollectionAttributesComponent implements OnInit, OnDestroy {

  public collection: CollectionModel;
  public attributes: AttributeModel[] = [];
  public searchString: string;
  public attributePlaceholder: string;
  public newAttributeName: string;

  private collectionSubscription = new Subscription();

  constructor(private i18n: I18n,
              private notificationService: NotificationService,
              private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.subscribeData();
    this.translatePlaceholders();
  }

  public ngOnDestroy() {
    this.collectionSubscription.unsubscribe();
  }

  public setDefaultAttribute(attribute: AttributeModel) {
    this.store.dispatch(new CollectionsAction.SetDefaultAttribute({collectionId: this.collection.id, attributeId: attribute.id}));
  }

  public onCreateAttribute(name: string) {
    if (name === '') {
      return;
    }
    const attribute = {name, constraints: [], usageCount: 0};
    // TODO optimistic
    this.store.dispatch(new CollectionsAction.CreateAttributes({collectionId: this.collection.id, attributes: [attribute]}));
  }

  public onNewAttributeName(attribute: AttributeModel, newName: string) {
    if (newName === '') {
      this.showAttributeDeleteDialog(attribute, () => {
        // TODO set attributeName back
      })
    } else {
      // TODO optimistic
      const updatedAttribute = {...attribute, name: newName};
      this.store.dispatch(new CollectionsAction.ChangeAttribute({
        collectionId: this.collection.id,
        attributeId: attribute.id, attribute: updatedAttribute
      }));
    }
  }

  public onDeleteAttribute(attribute: AttributeModel) {
    this.showAttributeDeleteDialog(attribute);
  }

  public showAttributeDeleteDialog(attribute: AttributeModel, onCancel?: () => void) {
    const title = this.i18n({id: 'collection.tab.attributes.delete.message', value: 'Delete attribute?'});
    const message = this.i18n({id: 'collection.tab.attributes.delete.message', value: 'Attribute "{{name}}" is about to be permanently deleted.'}, {
      name: attribute.name
    });
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(
      message,
      title,
      [
        {text: yesButtonText, action: () => this.deleteAttribute(attribute), bold: false},
        {text: noButtonText, action: onCancel}
      ]
    );
  }

  public deleteAttribute(attribute: AttributeModel) {
    // TODO optimistic
    this.store.dispatch(new CollectionsAction.RemoveAttribute({collectionId: this.collection.id, attributeId: attribute.id}));
  }

  public lightenColor(color: string): string {
    return HtmlModifier.shadeColor(color, .5);
  }

  private subscribeData() {
    this.collectionSubscription.add(this.store.select(selectCollectionByWorkspace)
      .pipe(filter(collection => !isNullOrUndefined(collection)))
      .subscribe(collection => {
        this.collection = collection;
        this.attributes = this.collection.attributes.slice();
      })
    )
  }

  private translatePlaceholders() {
    this.attributePlaceholder = this.i18n({
      id: 'collection.tab.attributes.attribute.placeholder',
      value: 'Enter name and hit enter.'
    })
  }
}
