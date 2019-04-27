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
import {AttributeEditablePipe} from './attribute-editable.pipe';
import {AttributesSelectItemsPipe} from './attributes-select-items.pipe';
import {CanActivatePagePipe} from './can-activate-page.pipe';
import {CanChangeRolesPipe} from './can-change-roles.pipe';
import {CollectionAttributeEditablePipe} from './collection-attribute-editable.pipe';
import {CollectionAttributePipe} from './collection-attribute.pipe';
import {CollectionByIdPipe} from './collection-by-id.pipe';
import {CollectionLinkTypesPipe} from './collection-link-types.pipe';
import {CollectionsSelectItemsPipe} from './collections-select-items.pipe';
import {ColorsPipe} from './colors.pipe';
import {ConstraintTypeIconPipe} from './constraint-type-icon.pipe';
import {ContrastColorPipe} from './contrast-color.pipe';
import {DataPipesModule} from './data/data-pipes.module';
import {DefaultAttributePipe} from './default-attribute.pipe';
import {EmptyQueryPipe} from './empty-query.pipe';
import {EmptyPipe} from './empty.pipe';
import {FilterPerspectivesPipe} from './filter-perspectives.pipe';
import {FormatDatePipe} from './format-date.pipe';
import {HighlightTextPipe} from './highlight-text.pipe';
import {IconsPipe} from './icons.pipe';
import {IncludesPipe} from './includes.pipe';
import {IsOrganizationTypePipe} from './is-organization-type.pipe';
import {LengthGreaterThanPipe} from './length-greater-than.pipe';
import {LightenColorPipe} from './lighten-color.pipe';
import {LinkTypesSelectItemsPipe} from './link-types-select-items.pipe';
import {LogPipe} from './log.pipe';
import {NativeDatePipe} from './native-date.pipe';
import {PageEndIndexPipe} from './page-end-index.pipe';
import {PageSlicePipe} from './page-slice.pipe';
import {ParseDatePipe} from './parse-date.pipe';
import {PermissionsPipesModule} from './permissions/permissions-pipes.module';
import {PerspectiveIconPipe} from './perspective-icon.pipe';
import {PrefixPipe} from './prefix.pipe';
import {RemoveHtmlCommentsPipe} from './remove-html-comments.pipe';
import {ResourceRolesPipe} from './resource-roles.pipe';
import {RoleIconPipe} from './role-icon.pipe';
import {RoleTitlePipe} from './role-title.pipe';
import {SingleCollectionQueryPipe} from './single-collection-query.pipe';
import {UserRolesInResourcePipe} from './user-roles-in-resource.pipe';
import {WorkspaceDefaultUrlPipe} from './workspace-default-url.pipe';
import {WorkspaceSetPipe} from './workspace-set.pipe';
import {ConstraintTypeIconTitlePipe} from './constraint-type-icon-title.pipe';
import {JoinPipe} from './join.pipe';
import {SafeHtmlPipe} from './safe-html.pipe';
import {EmailValidPipe} from './email/email-valid.pipe';
import {UserByEmailPipe} from './email/user-by-email.pipe';

@NgModule({
  imports: [CommonModule, DataPipesModule, PermissionsPipesModule],
  declarations: [
    LightenColorPipe,
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
    ParseDatePipe,
    CollectionAttributePipe,
    ContrastColorPipe,
    AttributesSelectItemsPipe,
    LinkTypesSelectItemsPipe,
    CollectionLinkTypesPipe,
    CollectionsSelectItemsPipe,
    CollectionByIdPipe,
    WorkspaceDefaultUrlPipe,
    CollectionAttributeEditablePipe,
    AttributeEditablePipe,
    ConstraintTypeIconPipe,
    ConstraintTypeIconTitlePipe,
    FormatDatePipe,
    JoinPipe,
    SafeHtmlPipe,
    EmailValidPipe,
    UserByEmailPipe,
  ],
  exports: [
    LightenColorPipe,
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
    DataPipesModule,
    ParseDatePipe,
    CollectionAttributePipe,
    ContrastColorPipe,
    AttributesSelectItemsPipe,
    LinkTypesSelectItemsPipe,
    CollectionLinkTypesPipe,
    CollectionsSelectItemsPipe,
    CollectionByIdPipe,
    WorkspaceDefaultUrlPipe,
    CollectionAttributeEditablePipe,
    AttributeEditablePipe,
    ConstraintTypeIconPipe,
    ConstraintTypeIconTitlePipe,
    FormatDatePipe,
    JoinPipe,
    SafeHtmlPipe,
    EmailValidPipe,
    UserByEmailPipe,
  ],
})
export class PipesModule {}
