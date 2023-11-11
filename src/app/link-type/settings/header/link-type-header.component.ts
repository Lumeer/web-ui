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

import {Component, ChangeDetectionStrategy, Input, ViewChild, Output, EventEmitter} from '@angular/core';
import {LinkType} from '../../../core/store/link-types/link.type';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {InputBoxComponent} from '../../../shared/input/input-box/input-box.component';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {containsSameElements} from '../../../shared/utils/array.utils';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {NotificationService} from '../../../core/notifications/notification.service';

@Component({
  selector: 'link-type-header',
  templateUrl: './link-type-header.component.html',
  styleUrls: ['./link-type-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeHeaderComponent {
  @ViewChild(InputBoxComponent)
  public inputBoxComponent: InputBoxComponent;

  @Input()
  public linkType: LinkType;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public allLinkTypes: LinkType[];

  @Output()
  public onBack = new EventEmitter();

  constructor(
    private store$: Store<AppState>,
    private notificationService: NotificationService
  ) {}

  public onNewName(name: string) {
    const trimmedValue = (name || '').trim();
    if (trimmedValue !== this.linkType?.name) {
      if (this.nameExist(trimmedValue)) {
        this.store$.dispatch(new NotificationsAction.ExistingLinkWarning({name: trimmedValue}));
        this.resetName();
      } else {
        this.update({...this.linkType, name});
      }
    }
  }

  private update(linkType: LinkType) {
    this.store$.dispatch(new LinkTypesAction.Update({linkType}));
  }

  private resetName() {
    this.inputBoxComponent?.setValue(this.linkType.name);
  }

  private nameExist(name: string): boolean {
    return (this.allLinkTypes || []).some(
      linkType =>
        linkType.id !== this.linkType.id &&
        linkType.name === name &&
        containsSameElements(linkType.collectionIds, this.linkType.collectionIds)
    );
  }

  public onDelete() {
    if (this.linkType) {
      const title = $localize`:@@collection.tab.linktypes.delete.title:Delete link type?`;
      const message = $localize`:@@collection.tab.linktypes.delete.message:Do you really want to delete the link type "${this.linkType.name}:name:" and all its usages?`;
      this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteLinkType(this.linkType));
    }
  }

  public deleteLinkType(linkType: LinkType) {
    this.store$.dispatch(new LinkTypesAction.Delete({linkTypeId: linkType.id}));
  }
}
