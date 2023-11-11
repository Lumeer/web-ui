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
import {select, Store} from '@ngrx/store';
import {selectLinkTypesInQuery} from '../../../core/store/common/permissions.selectors';
import {combineLatest, Observable} from 'rxjs';
import {selectAllCollections, selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {mapLinkTypeCollections} from '../../utils/link-type.utils';
import {AppState} from '../../../core/store/app.state';
import {AttributesResourceType} from '../../../core/model/resource';
import {queryStemAttributesResourcesOrder} from '../../../core/store/navigation/query/query.util';
import {AttributesResourceData} from '../attributes/attributes-settings-configuration';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {getDefaultAttributeId} from '../../../core/store/collections/collection.util';
import {Query} from '../../../core/store/navigation/query/query';
import {selectPerspective} from '../../../core/store/navigation/navigation.state';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {AttributesSettings, DataSettings, ViewSettings} from '../../../core/store/view-settings/view-settings';

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

  constructor(
    private store$: Store<AppState>,
    private perspectiveService: PerspectiveService
  ) {}

  public ngOnInit() {
    const query$ = this.selectQuery$();
    const collections$ = this.store$.pipe(select(selectAllCollections));
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
            resource =>
              !order.some(o => o.resource.id === resource.id && o.type === getAttributesResourceType(resource))
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

  private selectQuery$(): Observable<Query> {
    return this.store$.pipe(
      select(selectPerspective),
      distinctUntilChanged(),
      switchMap(perspective => this.perspectiveService.selectQuery$(perspective))
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
