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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {removeAllFormControls} from '../../../../../../shared/utils/form.utils';
import {AutoLinkRuleConfiguration} from '../../../../../../core/model/rule';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';
import {Collection} from '../../../../../../core/store/collections/collection';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../core/store/app.state';
import {
  selectCollectionByWorkspace,
  selectCollectionsDictionary,
} from '../../../../../../core/store/collections/collections.state';
import {combineLatest as observableCombineLatest, Observable, Subscription} from 'rxjs';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../../../../../core/store/common/permissions.selectors';
import {map, mergeMap, tap} from 'rxjs/operators';

@Component({
  selector: 'auto-link-form',
  templateUrl: './auto-link-form.component.html',
  styleUrls: ['./auto-link-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoLinkFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public config: AutoLinkRuleConfiguration;

  @Input()
  public form: FormGroup;

  public linkTypes$: Observable<LinkType[]>;

  public selectedLinkType: LinkType;

  public linkedCollection: Collection;

  public selectedAttribute1 = '';
  public selectedAttribute2 = '';

  private linkTypes: LinkType[];

  private subscriptions = new Subscription();

  public selectItems: SelectItemModel[] = [
    {id: 1, value: 'super truper link', icons: ['fas fa-eye', 'fas fa-plus'], iconColors: ['#ff7700', '#0077FF']},
    {id: 2, value: 'úplně jiný link', icons: ['fas fa-trash', 'fas fa-cog'], iconColors: ['#ff7700', '#0077FF']},
  ];

  public attributes1: SelectItemModel[] = [
    {id: 'a1', value: 'Attr1', icons: ['fas fa-cog'], iconColors: ['#DD00DD']},
    {id: 'a2', value: 'Attr2', icons: ['fas fa-plus'], iconColors: ['#FFDD00']},
  ];

  public attributes2: SelectItemModel[] = [];

  constructor(private store$: Store<AppState>) {}

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
      })
    );
    this.attributes1 = this.collectionAttributesToSelectItems(this.collection);
    // this.collection$ = this.store$.select(selectCollectionByWorkspace);
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

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.form.addControl('attribute1', new FormControl(this.config && this.config.attribute1));
    this.form.addControl('attribute2', new FormControl(this.config && this.config.attribute2));
    this.form.addControl('linkType', new FormControl(this.config && this.config.linkType));
  }

  public onSelectLinkType(linkTypeId: string) {
    this.selectedLinkType = this.linkTypes.find(linkType => linkType.id === linkTypeId);
    this.config.linkType = this.selectedLinkType.id;
    this.linkedCollection =
      this.selectedLinkType.collections[0].id === this.collection.id
        ? this.selectedLinkType.collections[1]
        : this.selectedLinkType.collections[0];
    this.attributes2 = this.collectionAttributesToSelectItems(this.linkedCollection);
  }

  public onSelectAttribute1(attribute1: string) {
    this.config.attribute1 = attribute1;
    this.selectedAttribute1 = attribute1;
  }

  public onSelectAttribute2(attribute2: string) {
    this.config.attribute2 = attribute2;
    this.selectedAttribute2 = attribute2;
  }
}
