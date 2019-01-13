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
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Store} from '@ngrx/store';
import {filter, map, mergeMap} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../core/constants';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {LinkType} from '../../core/store/link-types/link.type';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {DialogService} from '../dialog.service';

@Component({
  selector: 'create-collection-dialog',
  templateUrl: './create-collection-dialog.component.html',
})
export class CreateCollectionDialogComponent implements OnInit, OnDestroy {
  public linkedCollection: Collection;

  public form: FormGroup;
  public collectionFormGroup: FormGroup;
  public linkTypeFormGroup: FormGroup;

  public color: string = DEFAULT_COLOR;
  public icon: string = DEFAULT_ICON;

  private subscriptions = new Subscription();

  constructor(private dialogService: DialogService, private route: ActivatedRoute, private store: Store<AppState>) {
    this.createForm();
  }

  private createForm() {
    this.collectionFormGroup = this.createCollectionFormGroup();
    this.linkTypeFormGroup = this.createLinkTypeFormGroup();

    this.form = new FormGroup({
      collection: this.collectionFormGroup,
      linkType: this.linkTypeFormGroup,
    });
  }

  private createCollectionFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return new FormGroup({
      collectionName: new FormControl('', validators),
    });
  }

  private createLinkTypeFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return new FormGroup({
      linkName: new FormControl('', validators),
    });
  }

  public get collectionNameInput(): AbstractControl {
    return this.collectionFormGroup.get('collectionName');
  }

  public get linkNameInput(): AbstractControl {
    return this.linkTypeFormGroup.get('linkName');
  }

  public ngOnInit() {
    this.reset();

    this.subscriptions.add(this.subscribeToLinkedCollection());
  }

  private subscribeToLinkedCollection(): Subscription {
    return this.route.paramMap
      .pipe(
        map(params => params.get('linkedCollectionId')),
        filter(linkedCollectionId => !!linkedCollectionId),
        mergeMap(linkedCollectionId => this.store.select(selectCollectionById(linkedCollectionId))),
        filter(linkedCollection => !!linkedCollection)
      )
      .subscribe(linkedCollection => (this.linkedCollection = linkedCollection));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public reset() {
    this.color = DEFAULT_COLOR;
    this.icon = DEFAULT_ICON;
    this.form.reset();
  }

  public colors(): string[] {
    return [this.linkedCollection.color, this.color];
  }

  public icons(): string[] {
    return [this.linkedCollection.icon, this.icon];
  }

  public onSubmit() {
    const callback = this.dialogService.callback;

    this.store.dispatch(this.createCollectionAction());

    if (!callback) {
      this.dialogService.closeDialog();
    }
  }

  private createCollectionAction(): CollectionsAction.Create {
    const collection: Collection = {
      name: this.collectionNameInput.value,
      color: this.color,
      icon: this.icon,
      description: '',
    };
    const callback = this.linkedCollection ? this.createLinkTypeCallback() : this.dialogService.callback;
    return new CollectionsAction.Create({collection, callback});
  }

  private createLinkTypeCallback(): (collection: Collection) => void {
    const linkType: LinkType = {
      name: this.linkNameInput.value,
      collectionIds: [this.linkedCollection.id, null],
    };
    const callback = this.dialogService.callback;
    const store = this.store;

    return collection => {
      linkType.collectionIds[1] = collection.id;
      store.dispatch(new LinkTypesAction.Create({linkType, callback}));
    };
  }

  public onCollectionNameChange() {
    if (this.linkedCollection && !this.linkNameInput.dirty) {
      const collectionName = this.collectionNameInput.value;
      const linkName = collectionName ? `${this.linkedCollection.name}-${collectionName}` : '';
      this.linkNameInput.setValue(linkName);
    }
  }
}
