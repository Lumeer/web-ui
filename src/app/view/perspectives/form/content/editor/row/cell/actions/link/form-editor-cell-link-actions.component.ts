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

import {Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges, OnInit} from '@angular/core';
import {AppState} from '../../../../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {FormLinkCellConfig} from '../../../../../../../../../core/store/form/form-model';
import {AttributesSettings, ViewSettings} from '../../../../../../../../../core/store/views/view';
import {Observable} from 'rxjs';
import {selectViewSettings} from '../../../../../../../../../core/store/view-settings/view-settings.state';
import {map, switchMap, tap} from 'rxjs/operators';
import {ViewSettingsAction} from '../../../../../../../../../core/store/view-settings/view-settings.action';
import {LinkType} from '../../../../../../../../../core/store/link-types/link.type';
import {selectLinkTypeByIdWithCollections} from '../../../../../../../../../core/store/link-types/link-types.state';
import {Collection} from '../../../../../../../../../core/store/collections/collection';
import {getOtherLinkedCollectionId} from '../../../../../../../../../shared/utils/link-type.utils';
import {selectCollectionById} from '../../../../../../../../../core/store/collections/collections.state';

@Component({
  selector: 'form-editor-cell-link-actions',
  templateUrl: './form-editor-cell-link-actions.component.html',
  styleUrls: ['./form-editor-cell-link-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorCellLinkActionsComponent implements OnInit, OnChanges {
  @Input()
  public config: FormLinkCellConfig;

  @Input()
  public collectionId: string;

  public attributeSettings$: Observable<AttributesSettings>;
  public linkType$: Observable<LinkType>;
  public otherCollection$: Observable<Collection>;

  private viewSettings: ViewSettings;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.attributeSettings$ = this.store$.pipe(
      select(selectViewSettings),
      tap(settings => (this.viewSettings = settings)),
      map(settings => settings?.attributes)
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.linkType$ = this.store$.pipe(select(selectLinkTypeByIdWithCollections(this.config?.linkTypeId)));
    }
    if (changes.config || changes.collectionId) {
      this.otherCollection$ = this.linkType$.pipe(
        map(linkType => getOtherLinkedCollectionId(linkType, this.collectionId)),
        switchMap(collectionId => this.store$.pipe(select(selectCollectionById(collectionId))))
      );
    }
  }

  public onAttributesSettingsChanged(attributesSettings: AttributesSettings) {
    const changedSettings: ViewSettings = {...this.viewSettings, attributes: attributesSettings};
    this.store$.dispatch(new ViewSettingsAction.SetSettings({settings: changedSettings}));
  }
}
