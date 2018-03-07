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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../../../core/constants';
import {AppState} from '../../../../../core/store/app.state';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../../core/store/collections/collections.action';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {LinkTypesAction} from '../../../../../core/store/link-types/link-types.action';
import {SmartDocAction} from '../../../../../core/store/smartdoc/smartdoc.action';
import {SmartDocPartModel, SmartDocPartType} from '../../../../../core/store/smartdoc/smartdoc.model';
import {SelectedSmartDocPart, selectSelectedSmartDocPart} from '../../../../../core/store/smartdoc/smartdoc.state';
import {CollectionValidators} from '../../../../../core/validators/collection.validators';
import {Perspective} from '../../../perspective';

declare let $: any;

@Component({
  selector: 'new-collection-dialog',
  templateUrl: './new-collection-dialog.component.html'
})
export class NewCollectionDialogComponent implements OnInit, OnDestroy {

  @Input()
  public id: string;

  @Input()
  public linkedCollection: CollectionModel;

  private selectedSmartDocPart: SelectedSmartDocPart;
  private smartDocSubscription: Subscription;

  public form: FormGroup;
  public collectionFormGroup: FormGroup;
  public linkTypeFormGroup: FormGroup;

  public color: string = DEFAULT_COLOR;
  public icon: string = DEFAULT_ICON;

  constructor(private collectionValidators: CollectionValidators,
              private router: Router,
              private store: Store<AppState>) {
    this.createForm();
  }

  private createForm() {
    this.collectionFormGroup = this.createCollectionFormGroup();
    this.linkTypeFormGroup = this.createLinkTypeFormGroup();

    this.form = new FormGroup({
      collection: this.collectionFormGroup,
      linkType: this.linkTypeFormGroup
    });
  }

  private createCollectionFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return new FormGroup({
      collectionName: new FormControl('', validators, this.collectionValidators.uniqueName())
    });
  }

  private createLinkTypeFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return new FormGroup({
      linkName: new FormControl('', validators)
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

    if (this.linkedCollection) {
      this.subscribeToSelectedSmartDocPart();
    }

    if (!this.id) {
      this.id = 'newCollectionDialogModal';
    }
  }

  private subscribeToSelectedSmartDocPart() {
    this.smartDocSubscription = this.store.select(selectSelectedSmartDocPart).pipe(
      filter(selectedPart => !!selectedPart)
    ).subscribe(selectedPart => {
      this.selectedSmartDocPart = selectedPart;
      this.reset();
    });
  }

  public ngOnDestroy() {
    if (this.smartDocSubscription) {
      this.smartDocSubscription.unsubscribe();
    }
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
    const action = this.createCollectionAction();
    this.store.dispatch(action);

    this.reset();
    this.hide();
  }

  private hide() {
    $(`#${this.id}`).modal('hide');
  }

  private createCollectionAction(): CollectionsAction.Create {
    const collection: CollectionModel = {
      name: this.collectionNameInput.value,
      color: this.color,
      icon: this.icon,
      description: ''
    };
    const nextAction = this.linkedCollection ? this.createLinkTypeAction() : null;
    return new CollectionsAction.Create({collection, nextAction});
  }

  private createLinkTypeAction(): LinkTypesAction.Create {
    const linkType: LinkTypeModel = {
      name: this.linkNameInput.value,
      collectionIds: [this.linkedCollection.id, null]
    };
    const nextAction = this.selectedSmartDocPart ? this.createAddSmartDocPartAction() : null;
    return new LinkTypesAction.Create({linkType, nextAction});
  }

  private createAddSmartDocPartAction() {
    const part: SmartDocPartModel = {
      type: SmartDocPartType.Embedded,
      perspective: Perspective.Table
    };
    return new SmartDocAction.AddPart({
      partPath: this.selectedSmartDocPart.path,
      partIndex: this.selectedSmartDocPart.partIndex + 1,
      part
    });
  }

  public onCollectionNameChange() {
    if (this.linkedCollection && !this.linkNameInput.dirty) {
      const collectionName = this.collectionNameInput.value;
      const linkName = collectionName ? `${this.linkedCollection.name}-${collectionName}` : '';
      this.linkNameInput.setValue(linkName);
    }
  }

}
