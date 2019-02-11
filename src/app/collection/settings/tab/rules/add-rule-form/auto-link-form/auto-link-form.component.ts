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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';
import {Collection} from '../../../../../../core/store/collections/collection';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../core/store/app.state';
import {selectCollectionsDictionary} from '../../../../../../core/store/collections/collections.state';
import {combineLatest as observableCombineLatest, Observable, Subscription} from 'rxjs';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../../../../../core/store/common/permissions.selectors';
import {map} from 'rxjs/operators';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'auto-link-form',
  templateUrl: './auto-link-form.component.html',
  styleUrls: ['./auto-link-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoLinkFormComponent implements OnInit, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public form: FormGroup;

  public linkTypes$: Observable<LinkType[]>;

  public selectedLinkType: LinkType;

  public linkedCollection: Collection;

  private linkTypes: LinkType[];

  private subscriptions = new Subscription();

  public selectItems: SelectItemModel[] = [];
  public attributes1: SelectItemModel[] = [];
  public attributes2: SelectItemModel[] = [];

  constructor(private store$: Store<AppState>, public i18n: I18n) {}

  public ngOnInit(): void {
    this.linkTypes$ = this.selectLinkTypesForCollection(this.collection.id);
    this.subscriptions.add(
      this.linkTypes$.pipe().subscribe(linkTypes => {
        this.linkTypes = linkTypes;
        this.selectItems = linkTypes.map(linkType => {
          return {
            id: linkType.id,
            value: linkType.name,
            icons: [linkType.collections[0].icon, linkType.collections[1].icon],
            iconColors: [linkType.collections[0].color, linkType.collections[1].color],
          } as SelectItemModel;
        });

        const linkTypeId = this.form.get('linkType').value;
        if (linkTypeId) {
          this.onSelectLinkType(linkTypeId);
        }
      })
    );
    this.attributes1 = this.collectionAttributesToSelectItems(this.collection);
  }

  private collectionAttributesToSelectItems(collection: Collection): SelectItemModel[] {
    return collection.attributes.map(attribute => {
      return {
        id: attribute.id,
        value: attribute.name,
        icons: [collection.icon],
        iconColors: [collection.color],
      } as SelectItemModel;
    });
  }

  private selectLinkTypesForCollection(collectionId: string): Observable<LinkType[]> {
    return observableCombineLatest(
      this.store$.select(selectLinkTypesByCollectionId(collectionId)),
      this.store$.select(selectCollectionsDictionary)
    ).pipe(
      map(([linkTypes, collectionsMap]) =>
        linkTypes.map(linkType => {
          const collections: [Collection, Collection] = [
            collectionsMap[linkType.collectionIds[0]],
            collectionsMap[linkType.collectionIds[1]],
          ];
          return {...linkType, collections};
        })
      )
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public get attribute1Id(): string {
    return this.form.get('attribute1').value;
  }

  public get attribute2Id(): string {
    return this.form.get('attribute2').value;
  }

  public get linkTypeId(): string {
    return this.form.get('linkType').value;
  }

  public onSelectLinkType(linkTypeId: string) {
    this.selectedLinkType = this.linkTypes.find(linkType => linkType.id === linkTypeId);
    this.form.get('linkType').setValue(linkTypeId);
    this.form.get('collection1').setValue(this.collection.id);
    this.linkedCollection =
      this.selectedLinkType.collections[0].id === this.collection.id
        ? this.selectedLinkType.collections[1]
        : this.selectedLinkType.collections[0];
    this.form.get('collection2').setValue(this.linkedCollection.id);
    this.attributes2 = this.collectionAttributesToSelectItems(this.linkedCollection);
  }

  public onSelectAttribute1(attribute1: string) {
    this.form.get('attribute1').setValue(attribute1);
  }

  public onSelectAttribute2(attribute2: string) {
    this.form.get('attribute2').setValue(attribute2);
  }
}
