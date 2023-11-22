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
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable, combineLatest, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {AppState} from '../../../../../../core/store/app.state';
import {Collection} from '../../../../../../core/store/collections/collection';
import {getDefaultAttributeId} from '../../../../../../core/store/collections/collection.util';
import {
  selectCollectionById,
  selectCollectionsDictionary,
} from '../../../../../../core/store/collections/collections.state';
import {selectLinkTypesByCollectionId} from '../../../../../../core/store/common/permissions.selectors';
import {selectLinkTypeById} from '../../../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {AttributesSettings} from '../../../../../../core/store/view-settings/view-settings';
import {DropdownPosition} from '../../../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../../../dropdown/dropdown.component';
import {AttributesResourceData} from '../../../../../settings/attributes/attributes-settings-configuration';
import {getOtherLinkedCollectionId, mapLinkTypeCollections} from '../../../../../utils/link-type.utils';

@Component({
  selector: 'detail-settings-dropdown',
  templateUrl: './detail-settings-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSettingsDropdownComponent implements OnChanges {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public resource: AttributesResource;

  @Input()
  public resourceType: AttributesResourceType;

  @Output()
  public attributesSettingsChanged = new EventEmitter<AttributesSettings>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomEnd];

  public attributesResourcesData$: Observable<AttributesResourceData[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource || changes.resourceType) {
      this.subscribeResources();
    }
  }

  private subscribeResources() {
    if (this.resourceType === AttributesResourceType.Collection) {
      const collection$ = this.store$.pipe(select(selectCollectionById(this.resource.id)));
      const linkTypes$ = combineLatest([
        this.store$.pipe(select(selectLinkTypesByCollectionId(this.resource.id))),
        this.store$.pipe(select(selectCollectionsDictionary)),
      ]).pipe(
        map(([linkTypes, collectionsMap]) =>
          linkTypes.map(linkType => mapLinkTypeCollections(linkType, collectionsMap))
        )
      );
      this.attributesResourcesData$ = combineLatest([collection$, linkTypes$]).pipe(
        map(([collection, linkTypes]) => [
          this.getCollectionAttributesResourceData(collection),
          ...linkTypes.reduce(
            (array, linkType) => [...array, ...this.getLinkAttributesResourceData(linkType, true)],
            []
          ),
        ])
      );
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      this.attributesResourcesData$ = this.store$.pipe(
        select(selectLinkTypeById(this.resource.id)),
        map(linkType => (linkType ? this.getLinkAttributesResourceData(linkType) : []))
      );
    } else {
      this.attributesResourcesData$ = of([]);
    }
  }

  private getCollectionAttributesResourceData(
    collection: Collection,
    sortable?: boolean,
    composedWithId?: string
  ): AttributesResourceData {
    return (
      collection && {
        resource: collection,
        defaultAttributeId: getDefaultAttributeId(collection),
        type: AttributesResourceType.Collection,
        sortable,
        composedWithId,
      }
    );
  }

  private getLinkAttributesResourceData(linkType: LinkType, sortable?: boolean): AttributesResourceData[] {
    const data = [];
    if (linkType) {
      data.push({resource: linkType, type: AttributesResourceType.LinkType, sortable});
      if (linkType.collections?.length === 2) {
        const otherCollectionId = getOtherLinkedCollectionId(linkType, this.resource.id);
        const collection = otherCollectionId && linkType.collections.find(coll => coll.id === otherCollectionId);
        if (collection) {
          data.push(this.getCollectionAttributesResourceData(collection, sortable, linkType.id));
        }
      }
    }
    return data;
  }

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public open() {
    this.dropdown?.open();
  }

  public close() {
    this.dropdown?.close();
  }
}
