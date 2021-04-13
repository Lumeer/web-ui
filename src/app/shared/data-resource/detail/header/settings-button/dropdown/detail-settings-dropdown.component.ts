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
import {AttributesSettings, ViewSettings} from '../../../../../../core/store/views/view';
import {DropdownComponent} from '../../../../../dropdown/dropdown.component';
import {DropdownPosition} from '../../../../../dropdown/dropdown-position';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../../../core/store/app.state';
import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {combineLatest, Observable, of} from 'rxjs';
import {selectLinkTypesByCollectionId} from '../../../../../../core/store/common/permissions.selectors';
import {
  selectCollectionById,
  selectCollectionsDictionary,
} from '../../../../../../core/store/collections/collections.state';
import {map} from 'rxjs/operators';
import {mapLinkTypeCollections} from '../../../../../utils/link-type.utils';
import {selectLinkTypeById} from '../../../../../../core/store/link-types/link-types.state';
import {AttributesResourceData} from '../../../../../settings/attributes/attributes-settings-configuration';
import {Collection} from '../../../../../../core/store/collections/collection';
import {getDefaultAttributeId} from '../../../../../../core/store/collections/collection.util';
import {LinkType} from '../../../../../../core/store/link-types/link.type';

@Component({
  selector: 'detail-settings-dropdown',
  templateUrl: './detail-settings-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSettingsDropdownComponent implements OnChanges {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public settings: ViewSettings;

  @Input()
  public resource: AttributesResource;

  @Input()
  public resourceType: AttributesResourceType;

  @Output()
  public attributeSettingsChanged = new EventEmitter<AttributesSettings>();

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
          ...linkTypes.map(linkType => this.getLinkAttributesResourceData(linkType, true)),
        ])
      );
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      this.attributesResourcesData$ = this.store$.pipe(
        select(selectLinkTypeById(this.resource.id)),
        map(linkType => (linkType ? [this.getLinkAttributesResourceData(linkType)] : []))
      );
    } else {
      this.attributesResourcesData$ = of([]);
    }
  }

  private getCollectionAttributesResourceData(collection: Collection): AttributesResourceData {
    return (
      collection && {
        resource: collection,
        defaultAttributeId: getDefaultAttributeId(collection),
        type: AttributesResourceType.Collection,
        sortable: false,
      }
    );
  }

  private getLinkAttributesResourceData(linkType: LinkType, sortable?: boolean): AttributesResourceData {
    return (
      linkType && {
        resource: linkType,
        type: AttributesResourceType.LinkType,
        sortable,
      }
    );
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
