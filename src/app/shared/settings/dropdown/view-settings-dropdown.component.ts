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
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {AttributesSettings, DataSettings, ViewSettings} from '../../../core/store/views/view';
import {select, Store} from '@ngrx/store';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {selectCollectionsByStems, selectLinkTypesInQuery} from '../../../core/store/common/permissions.selectors';
import {combineLatest, Observable} from 'rxjs';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {map} from 'rxjs/operators';
import {mapLinkTypeCollections} from '../../utils/link-type.utils';
import {AppState} from '../../../core/store/app.state';
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {queryStemAttributesResourcesOrder} from '../../../core/store/navigation/query/query.util';
import {AttributesResourceData} from '../attributes/attributes-settings-configuration';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {getDefaultAttributeId} from '../../../core/store/collections/collection.util';

@Component({
  selector: 'view-settings-dropdown',
  templateUrl: './view-settings-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSettingsDropdownComponent implements OnInit {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public settings: ViewSettings;

  @Input()
  public showAttributes: boolean;

  @Output()
  public attributeSettingsChanged = new EventEmitter<AttributesSettings>();

  @Output()
  public dataSettingsChange = new EventEmitter<DataSettings>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomEnd];

  public attributesResourcesData$: Observable<AttributesResourceData[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    const query$ = this.store$.pipe(select(selectViewQuery));
    const collections$ = this.store$.pipe(select(selectCollectionsByStems));
    const linkTypes$ = combineLatest([
      this.store$.pipe(select(selectLinkTypesInQuery)),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(([linkTypes, collectionsMap]) => linkTypes.map(linkType => mapLinkTypeCollections(linkType, collectionsMap)))
    );

    this.attributesResourcesData$ = combineLatest([query$, collections$, linkTypes$]).pipe(
      map(([query, collections, linkTypes]) => {
        return (query?.stems || []).reduce<AttributesResourceData[]>((order, stem) => {
          const stemOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes).filter(
            resource => !order.some(o => o.resource.id === resource.id)
          );

          for (const resource of stemOrder) {
            const type = getAttributesResourceType(resource);
            const defaultAttributeId =
              type === AttributesResourceType.Collection ? getDefaultAttributeId(resource) : null;
            order.push({resource, type, sortable: true, defaultAttributeId});
          }
          return order;
        }, []);
      })
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
