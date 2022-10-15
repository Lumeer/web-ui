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
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {selectUserById} from '../../../../core/store/users/users.state';
import {filter, map} from 'rxjs/operators';
import {Perspective, perspectiveIconsMap} from '../../../../view/perspectives/perspective';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DocumentFavoriteToggleService} from '../../../toggle/document-favorite-toggle.service';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {selectLinkTypeByIdWithCollections} from '../../../../core/store/link-types/link-types.state';
import {Attribute} from '../../../../core/store/collections/collection';
import {findAttribute, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {User} from '../../../../core/store/users/user';

import {ConstraintData} from '@lumeer/data-filters';
import {View} from '../../../../core/store/views/view';
import {DataResourcePermissions} from '../../../../core/model/data-resource-permissions';
import {ClipboardService} from '../../../../core/service/clipboard.service';
import {AttributesSettings} from '../../../../core/store/view-settings/view-settings';

@Component({
  selector: 'data-resource-detail-header',
  templateUrl: './data-resource-detail-header.component.html',
  styleUrls: ['./data-resource-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class DataResourceDetailHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public workspace: Workspace;

  @Input()
  public view: View;

  @Input()
  public dataPermissions: DataResourcePermissions;

  @Output()
  public switchToTable = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  @Output()
  public versionClick = new EventEmitter();

  @Output()
  public attributesSettingsChanged = new EventEmitter<AttributesSettings>();

  public readonly tableIcon = perspectiveIconsMap[Perspective.Table];
  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};
  public readonly collectionResourceType = AttributesResourceType.Collection;

  public document: DocumentModel;

  public resource$: Observable<AttributesResource>;

  public createdBy$: Observable<User>;
  public updatedBy$: Observable<User>;
  public copyUrlTooltip$ = new BehaviorSubject<string>('');

  public defaultAttribute: Attribute;
  public defaultValue: any;

  public readonly createdOnMsg;
  public readonly createdByMsg;
  public readonly updatedOnMsg;
  public readonly updatedByMsg;
  public readonly copyUrlMsg;

  private copyUrlTimer: number;

  constructor(
    private store$: Store<AppState>,
    private toggleService: DocumentFavoriteToggleService,
    private clipboardService: ClipboardService
  ) {
    this.createdOnMsg = $localize`:@@document.detail.header.createdOn:Created on`;
    this.createdByMsg = $localize`:@@document.detail.header.createdBy:Created by`;
    this.updatedOnMsg = $localize`:@@document.detail.header.updatedOn:Updated on`;
    this.updatedByMsg = $localize`:@@document.detail.header.updatedBy:Updated by`;
    this.copyUrlMsg = $localize`:@@document.detail.header.action.copyUrl:Copy link to this record`;
  }

  public ngOnInit() {
    this.copyUrlTooltip$.next(this.copyUrlMsg);
    this.toggleService.setWorkspace(this.workspace);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dataResource) {
      this.renewSubscriptions();
      this.document = <DocumentModel>this.dataResource;
    }
    if (changes.resource) {
      this.subscribeToResource();
    }

    if (changes.resource || changes.dataResource) {
      if (this.resourceType === AttributesResourceType.Collection) {
        const id = getDefaultAttributeId(this.resource);
        this.defaultAttribute = findAttribute(this.resource.attributes, id);
        this.defaultValue = this.dataResource?.data?.[id];
      } else {
        this.defaultAttribute = null;
        this.defaultValue = null;
      }
    }
  }

  private subscribeToResource() {
    if (this.resourceType === AttributesResourceType.Collection) {
      this.resource$ = of(this.resource);
    } else {
      this.resource$ = this.store$.pipe(select(selectLinkTypeByIdWithCollections(this.resource.id)));
    }
  }

  private renewSubscriptions() {
    if (this.dataResource) {
      this.createdBy$ = this.store$.pipe(
        select(selectUserById((<DocumentModel>this.dataResource).createdBy)),
        filter(user => !!user),
        map(user => {
          if (!user.name && !user.email) {
            return {...user, name: 'Guest', email: 'aturing@lumeer.io'};
          }
          return user;
        })
      );
      this.updatedBy$ = this.store$.pipe(
        select(selectUserById((<DocumentModel>this.dataResource).updatedBy)),
        filter(user => !!user),
        map(user => {
          if (!user.name && !user.email) {
            return {...user, name: 'Guest', email: 'aturing@lumeer.io'};
          }
          return user;
        })
      );
    }
  }

  public onSwitchToTable() {
    this.switchToTable.emit();
  }

  public onFavoriteToggle() {
    const document = <DocumentModel>this.dataResource;
    if (document && this.resourceType === AttributesResourceType.Collection) {
      this.toggleService.set(document.id, !document.favorite, document);
    }
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }

  public onRemove() {
    this.remove.emit();
  }

  public onCopyRecordUrl() {
    if (this.copyUrlTimer) {
      window.clearTimeout(this.copyUrlTimer);
    }
    this.copyUrl();
  }

  private copyUrl() {
    const currentUrl = window.location.href;

    const match = currentUrl.match('(.+/w/[^/]+/[^/]+/).*');
    if (match && match[1]) {
      const url = `${match[1]}document/${this.document.collectionId}/${this.document.id}`;
      this.clipboardService.copy(url);

      const copiedMessage = $localize`:@@copyTextBox.clipboard.copied:Copied!`;
      this.copyUrlTooltip$.next(copiedMessage);

      this.copyUrlTimer = window.setTimeout(() => {
        this.copyUrlTooltip$.next(this.copyUrlMsg);
        this.copyUrlTimer = null;
      }, 3000);
    }
  }
}
