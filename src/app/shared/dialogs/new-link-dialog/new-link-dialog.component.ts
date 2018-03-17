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

import {AfterViewInit, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Action, Store} from '@ngrx/store';
import {filter, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../core/store/app.state';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {selectAllCollections} from '../../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../../core/store/link-types/link-type.model';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {selectLinkCollectionIds, selectPerspective} from '../../../core/store/navigation/navigation.state';
import {SmartDocAction} from '../../../core/store/smartdoc/smartdoc.action';
import {SmartDocPartModel, SmartDocPartType} from '../../../core/store/smartdoc/smartdoc.model';
import {SelectedSmartDocPart, selectSelectedSmartDocPart} from '../../../core/store/smartdoc/smartdoc.state';
import {DEFAULT_TABLE_ID} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {Perspective} from '../../../view/perspectives/perspective';

declare let $: any;

@Component({
  selector: 'new-link-dialog',
  templateUrl: './new-link-dialog.component.html'
})
export class NewLinkDialogComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  public id = 'newLinkDialogModal';

  private collections: CollectionModel[];

  private selectedSmartDocPart: SelectedSmartDocPart;

  private perspective: Perspective;

  private subscriptions = new Subscription();

  public form: FormGroup;
  public linkTypeFormGroup: FormGroup;

  public linkInputFocused: boolean;

  constructor(private router: Router,
              private store: Store<AppState>) {
    this.createForm();
  }

  private createForm() {
    this.linkTypeFormGroup = this.createLinkTypeFormGroup();

    this.form = new FormGroup({
      linkType: this.linkTypeFormGroup
    });
  }

  private createLinkTypeFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return new FormGroup({
      linkName: new FormControl('', validators)
    });
  }

  public get linkNameInput(): AbstractControl {
    return this.linkTypeFormGroup.get('linkName');
  }

  public ngOnInit() {
    this.form.reset();

    this.subscribeToPerspective();
    this.subscribeToSelectedSmartDocPart();
    this.subscribeToLinkCollectionIds();
  }

  private subscribeToPerspective() {
    this.subscriptions.add(
      this.store.select(selectPerspective).subscribe(perspective => this.perspective = perspective)
    );
  }

  private subscribeToSelectedSmartDocPart() {
    this.subscriptions.add(
      this.store.select(selectSelectedSmartDocPart).pipe(
        withLatestFrom(this.store.select(selectPerspective)),
        filter(([selectedPart, perspective]) => !!selectedPart && perspective === Perspective.SmartDoc)
      ).subscribe(([selectedPart]) => this.selectedSmartDocPart = selectedPart)
    );
  }

  private subscribeToLinkCollectionIds() {
    this.subscriptions.add(
      this.store.select(selectLinkCollectionIds).pipe(
        filter(linkCollectionIds => !!linkCollectionIds),
        withLatestFrom(this.store.select(selectAllCollections))
      ).subscribe(([linkCollectionIds, collections]) => {
        this.collections = collections.filter(collection => linkCollectionIds.includes(collection.id));
        this.form.reset();
      })
    );
  }

  public ngAfterViewInit() {
    const selector = `#${this.id}`;
    $(selector).on('shown.bs.modal', () => {
      this.linkInputFocused = true;
    });
    $(selector).on('hidden.bs.modal', () => {
      this.removeLinkCollectionIdsFromQueryParams();
      this.form.reset();
      this.linkInputFocused = false;
    });
  }

  private removeLinkCollectionIdsFromQueryParams() {
    this.router.navigate([], {
      queryParams: {
        linkCollectionIds: undefined
      },
      queryParamsHandling: 'merge'
    });
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

    this.store.dispatch(this.createLinkTypeAction());
    $(`#${this.id}`).modal('hide');
  }

  private createLinkTypeAction(): LinkTypesAction.Create {
    const linkType: LinkTypeModel = {
      name: this.linkNameInput.value,
      collectionIds: [this.collections[0].id, this.collections[1].id]
    };
    return new LinkTypesAction.Create({linkType, nextAction: this.createNextAction()});
  }

  private createNextAction(): Action {
    if (this.perspective === Perspective.SmartDoc && this.selectedSmartDocPart) {
      return this.createAddSmartDocPartAction();
    }
    if (this.perspective === Perspective.Table2) {
      return new NavigationAction.AddLinkToQuery({linkTypeId: null});
    }
    return null;
  }

  private createAddSmartDocPartAction(): SmartDocAction.AddPart {
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

  private createTablePartAction(): TablesAction.CreatePart {
    return new TablesAction.CreatePart({
      tableId: DEFAULT_TABLE_ID, // TODO maybe detect instead
      linkTypeId: null
    });
  }

}
