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
import {filter, map, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {selectAllCollections} from '../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../core/store/link-types/link-type.model';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';
import {DialogService} from '../dialog.service';

@Component({
  selector: 'create-link-dialog',
  templateUrl: './create-link-dialog.component.html',
})
export class CreateLinkDialogComponent implements OnInit, OnDestroy {
  private collections: CollectionModel[];

  private subscriptions = new Subscription();

  public form: FormGroup;
  public linkTypeFormGroup: FormGroup;

  constructor(private dialogService: DialogService, private route: ActivatedRoute, private store: Store<AppState>) {
    this.createForm();
  }

  private createForm() {
    this.linkTypeFormGroup = this.createLinkTypeFormGroup();

    this.form = new FormGroup({
      linkType: this.linkTypeFormGroup,
    });
  }

  private createLinkTypeFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return new FormGroup({
      linkName: new FormControl('', validators),
    });
  }

  public get linkNameInput(): AbstractControl {
    return this.linkTypeFormGroup.get('linkName');
  }

  public ngOnInit() {
    this.subscribeToLinkCollectionIds();
  }

  private subscribeToLinkCollectionIds() {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          map(params => params.get('linkCollectionIds')),
          filter(linkCollectionIds => !!linkCollectionIds),
          map(linkCollectionIds => linkCollectionIds.split(',')),
          filter(linkCollectionIds => linkCollectionIds.length === 2),
          withLatestFrom(this.store.select(selectAllCollections))
        )
        .subscribe(([linkCollectionIds, collections]) => {
          this.collections = collections.filter(collection => linkCollectionIds.includes(collection.id));
          this.linkNameInput.setValue(this.collections.map(collection => collection.name).join(' '));
        })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public colors(): string[] {
    return this.collections ? this.collections.map(collection => collection.color) : [];
  }

  public icons(): string[] {
    return this.collections ? this.collections.map(collection => collection.icon) : [];
  }

  public onSubmit() {
    if (!this.form.valid) {
      return;
    }

    const callback = this.dialogService.callback;
    this.store.dispatch(this.createLinkTypeAction());
    if (!callback) {
      this.dialogService.closeDialog();
    }
  }

  private createLinkTypeAction(): LinkTypesAction.Create {
    const linkType: LinkTypeModel = {
      name: this.linkNameInput.value,
      collectionIds: [this.collections[0].id, this.collections[1].id],
    };
    return new LinkTypesAction.Create({linkType, callback: this.dialogService.callback});
  }
}
