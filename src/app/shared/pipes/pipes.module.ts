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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {HighlightTextPipe} from './highlight-text.pipe';
import {ColorsPipe} from './colors.pipe';
import {DefaultAttributePipe} from './default-attribute.pipe';
import {EmptyPipe} from './empty.pipe';
import {FilterPerspectivesPipe} from './filter-perspectives.pipe';
import {IconsPipe} from './icons.pipe';
import {LengthGreaterThanPipe} from './length-greater-than.pipe';
import {LightenColorPipe} from './lighten-color.pipe';
import {NativeDatePipe} from './native-date.pipe';
import {PageSlicePipe} from './page-slice.pipe';
import {PerspectiveIconPipe} from './perspective-icon.pipe';
import {PixelPipe} from './pixel.pipe';
import {PrefixPipe} from './prefix.pipe';
import {WorkspaceSetPipe} from './workspace-set.pipe';
import {EmptyQueryPipe} from './empty-query.pipe';
import {SingleCollectionQueryPipe} from './single-collection-query.pipe';
import {ResourceRolesPipe} from './resource-roles.pipe';
import {RoleIconPipe} from './role-icon.pipe';
import {RoleTitlePipe} from './role-title.pipe';
import {IncludesPipe} from './includes.pipe';
import {CanActivatePagePipe} from './can-activate-page.pipe';
import {PageEndIndexPipe} from './page-end-index.pipe';
import {LogPipe} from './log.pipe';
import {RemoveHtmlCommentsPipe} from './remove-html-comments.pipe';
import {PermissionsPipesModule} from './permissions/permissions-pipes.module';
import {IsOrganizationTypePipe} from './is-organization-type.pipe';
import {UserRolesInResourcePipe} from './user-roles-in-resource.pipe';
import {CanChangeRolesPipe} from './can-change-roles.pipe';

@NgModule({
  imports: [CommonModule, PermissionsPipesModule],
  declarations: [
    LightenColorPipe,
    PixelPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe,
    NativeDatePipe,
    PerspectiveIconPipe,
    FilterPerspectivesPipe,
    EmptyPipe,
    EmptyQueryPipe,
    LengthGreaterThanPipe,
    DefaultAttributePipe,
    PageSlicePipe,
    WorkspaceSetPipe,
    HighlightTextPipe,
    SingleCollectionQueryPipe,
    ResourceRolesPipe,
    RoleIconPipe,
    RoleTitlePipe,
    UserRolesInResourcePipe,
    IncludesPipe,
    CanActivatePagePipe,
    PageEndIndexPipe,
    LogPipe,
    RemoveHtmlCommentsPipe,
    IsOrganizationTypePipe,
    CanChangeRolesPipe,
  ],
  exports: [
    LightenColorPipe,
    PixelPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe,
    NativeDatePipe,
    PerspectiveIconPipe,
    FilterPerspectivesPipe,
    EmptyPipe,
    EmptyQueryPipe,
    LengthGreaterThanPipe,
    DefaultAttributePipe,
    PageSlicePipe,
    WorkspaceSetPipe,
    HighlightTextPipe,
    SingleCollectionQueryPipe,
    ResourceRolesPipe,
    RoleIconPipe,
    RoleTitlePipe,
    UserRolesInResourcePipe,
    IncludesPipe,
    CanActivatePagePipe,
    PageEndIndexPipe,
    LogPipe,
    RemoveHtmlCommentsPipe,
    PermissionsPipesModule,
    IsOrganizationTypePipe,
    CanChangeRolesPipe,
  ],
})
export class PipesModule {}
