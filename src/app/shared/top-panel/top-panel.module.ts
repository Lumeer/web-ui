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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatMenuModule} from '@angular/material/menu';
import {RouterModule} from '@angular/router';

import {ModalModule as NgxModalModule} from 'ngx-bootstrap/modal';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {GravatarModule} from 'ngx-gravatar';

import {BookmarksModule} from '../bookmarks/bookmarks.module';
import {DropdownModule} from '../dropdown/dropdown.module';
import {GetHelpModule} from '../get-help/get-help.module';
import {InputModule} from '../input/input.module';
import {ModalModule} from '../modal/modal.module';
import {PipesModule} from '../pipes/pipes.module';
import {RedDotModule} from '../red-dot/red-dot.module';
import {ControlsToggleComponent} from './controls-toggle/controls-toggle.component';
import {LumeerLogoComponent} from './lumeer-logo/lumeer-logo.component';
import {SearchBoxModule} from './search-box/search-box.module';
import {TopPanelComponent} from './top-panel.component';
import {InviteUserComponent} from './user-panel/invite-user/invite-user.component';
import {InviteUserModalComponent} from './user-panel/invite-user/modal/invite-user-modal.component';
import {NewUserComponent} from './user-panel/invite-user/modal/new-user/new-user.component';
import {NotificationsMenuModule} from './user-panel/notifications-menu/notifications-menu.module';
import {LanguageLinkPipe} from './user-panel/user-menu/language-link.pipe';
import {UserMenuComponent} from './user-panel/user-menu/user-menu.component';
import {UserPanelComponent} from './user-panel/user-panel.component';
import {ResourceMenuModule} from './workspace-panel/resource-menu/resource-menu.module';
import {WorkspacePanelComponent} from './workspace-panel/workspace-panel.component';
import {TopPanelWrapperComponent} from './wrapper/top-panel-wrapper.component';

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    RouterModule,
    ResourceMenuModule,
    SearchBoxModule,
    NotificationsMenuModule,
    ModalModule,
    NgxModalModule,
    FormsModule,
    ReactiveFormsModule,
    InputModule,
    DropdownModule,
    BookmarksModule,
    GetHelpModule,
    GravatarModule,
    TooltipModule.forRoot(),
    RedDotModule,
    MatMenuModule,
  ],
  declarations: [
    TopPanelComponent,
    TopPanelWrapperComponent,
    UserMenuComponent,
    LanguageLinkPipe,
    LumeerLogoComponent,
    WorkspacePanelComponent,
    UserPanelComponent,
    ControlsToggleComponent,
    InviteUserComponent,
    InviteUserModalComponent,
    NewUserComponent,
  ],
  exports: [TopPanelWrapperComponent, LumeerLogoComponent],
})
export class TopPanelModule {}
