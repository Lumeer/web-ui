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
import {AttributeEditablePipe} from './attribute-editable.pipe';
import {AttributesSelectItemsPipe} from './attributes-select-items.pipe';
import {CanActivatePagePipe} from './can-activate-page.pipe';
import {CanChangeRolesPipe} from './can-change-roles.pipe';
import {ResourceAttributeEditablePipe} from './resource-attribute-editable.pipe';
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
import {UniqueEntitiesPipe} from './unique-entities.pipe';
import {AggregationSelectItemsPipe} from './aggregation-select-items.pipe';
import {FindSelectConstraintItemByIdPipe} from './find-select-constraint-item-by-id.pipe';
import {QueryStemAttributesResourcesPipe} from './query-stem-attributes-resources.pipe';
import {SortPerspectivesPipe} from './sort-perspectives.pipe';
import {ArrayDifferencePipe} from './array/array-difference.pipe';
import {ConcatPipe} from './concat.pipe';
import {PerspectiveDisplayablePipe} from './perspective-displayable.pipe';
import {QueryColorPipe} from './query-color.pipe';
import {DocumentsByCollectionPipe} from './documents-by-collection.pipe';
import {PerspectiveNamePipe} from './perspective-name.pipe';
import {ValueFilterPipe} from './value-filter.pipe';
import {IsNullOrUndefinedPipe} from './is-null-or-undefined.pipe';
import {AttributesToDataSuggestionsPipe} from './attributes-to-data-suggestions.pipe';
import {AttributeFunctionDefinedPipe} from './attribute-function-defined.pipe';
import {StripHtmlPipe} from './strip-html.pipe';
import {ArrayReversePipe} from './array/array-reverse.pipe';
import {RoleHumanReadablePipe} from './role-human-readable.pipe';
import {RemoveSuffixPipe} from './remove-last-characters.pipe';
import {SafeStylePipe} from './safe-style.pipe';
import {ContainsDeletedQueryItemPipe} from './contains-deleted-query-item.pipe';
import {ResourceIconsColorsPipe} from './resource-icons-colors.pipe';
import {CleanQueryAttributePipe} from './clean-query-attribute.pipe';
import {QueryStemAttributesSelectItemsPipe} from './query-stem-attributes-select-items.pipe';
import {FilterNotNullPipe} from './filter-not-null.pipe';
import {QueryStemResourcesSelectItemsPipe} from './query-stem-resources-select-items.pipe';
import {UnescapeHtmlPipe} from './unescape-html.pipe';
import {IdToReferencePipe} from './id-to-reference.pipe';
import {FindAttributePipe} from './find-attribute.pipe';
import {IsNotNullOrUndefinedPipe} from './is-not-null-or-undefined.pipe';
import {ViewsSelectItemsPipe} from './views-select-items.pipe';
import {ColumnBackgroundPipe} from './collection-column-background.pipe';
import {IsDateValidPipe} from './is-date-valid.pipe';
import {FromNowPipe} from './from-now.pipe';
import {AttributeResourceTypeToResourceTypePipe} from './attribute-resource-type-to-resource-type.pipe';
import {LinkTypeOtherCollectionPipe} from './link-type-other-collection.pipe';
import {StateListConstraintPipe} from './state-list-constraint.pipe';
import {TruncatePipe} from './truncate.pipe';
import {AreObjectsEqualPipe} from './are-objects-equal.pipe';
import {AttributeTitlePipe} from './attribute-title.pipe';
import {ModifyAttributeForQueryFilterPipe} from './modify-attribute-for-query-filter.pipe';
import {StateListDataValuePipe} from './state-list-data-value.pipe';
import {CanCreateLinksPipe} from './can-create-links.pipe';

@NgModule({
  imports: [CommonModule, DataPipesModule],
  declarations: [
    LightenColorPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe,
    NativeDatePipe,
    PerspectiveIconPipe,
    SortPerspectivesPipe,
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
    CollectionAttributePipe,
    ContrastColorPipe,
    AttributesSelectItemsPipe,
    LinkTypesSelectItemsPipe,
    CollectionLinkTypesPipe,
    CollectionsSelectItemsPipe,
    CollectionByIdPipe,
    WorkspaceDefaultUrlPipe,
    ResourceAttributeEditablePipe,
    AttributeEditablePipe,
    ConstraintTypeIconPipe,
    ConstraintTypeIconTitlePipe,
    FormatDatePipe,
    JoinPipe,
    SafeHtmlPipe,
    EmailValidPipe,
    UserByEmailPipe,
    UniqueEntitiesPipe,
    AggregationSelectItemsPipe,
    FindSelectConstraintItemByIdPipe,
    QueryStemAttributesResourcesPipe,
    ArrayDifferencePipe,
    ConcatPipe,
    PerspectiveDisplayablePipe,
    QueryColorPipe,
    DocumentsByCollectionPipe,
    PerspectiveNamePipe,
    ValueFilterPipe,
    IsNullOrUndefinedPipe,
    AttributesToDataSuggestionsPipe,
    AttributeFunctionDefinedPipe,
    StripHtmlPipe,
    ArrayReversePipe,
    RoleHumanReadablePipe,
    RemoveSuffixPipe,
    SafeStylePipe,
    ContainsDeletedQueryItemPipe,
    ResourceIconsColorsPipe,
    CleanQueryAttributePipe,
    QueryStemAttributesSelectItemsPipe,
    QueryStemResourcesSelectItemsPipe,
    FilterNotNullPipe,
    UnescapeHtmlPipe,
    IdToReferencePipe,
    FindAttributePipe,
    IsNotNullOrUndefinedPipe,
    ViewsSelectItemsPipe,
    ColumnBackgroundPipe,
    IsDateValidPipe,
    FromNowPipe,
    AttributeResourceTypeToResourceTypePipe,
    LinkTypeOtherCollectionPipe,
    StateListConstraintPipe,
    TruncatePipe,
    AreObjectsEqualPipe,
    AttributeTitlePipe,
    ModifyAttributeForQueryFilterPipe,
    StateListDataValuePipe,
    CanCreateLinksPipe,
  ],
  exports: [
    LightenColorPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe,
    NativeDatePipe,
    PerspectiveIconPipe,
    SortPerspectivesPipe,
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
    DataPipesModule,
    CollectionAttributePipe,
    ContrastColorPipe,
    AttributesSelectItemsPipe,
    LinkTypesSelectItemsPipe,
    CollectionLinkTypesPipe,
    CollectionsSelectItemsPipe,
    CollectionByIdPipe,
    WorkspaceDefaultUrlPipe,
    ResourceAttributeEditablePipe,
    AttributeEditablePipe,
    ConstraintTypeIconPipe,
    ConstraintTypeIconTitlePipe,
    FormatDatePipe,
    JoinPipe,
    SafeHtmlPipe,
    EmailValidPipe,
    UserByEmailPipe,
    UniqueEntitiesPipe,
    AggregationSelectItemsPipe,
    FindSelectConstraintItemByIdPipe,
    QueryStemAttributesResourcesPipe,
    ArrayDifferencePipe,
    ConcatPipe,
    PerspectiveDisplayablePipe,
    QueryColorPipe,
    DocumentsByCollectionPipe,
    PerspectiveNamePipe,
    ValueFilterPipe,
    IsNullOrUndefinedPipe,
    AttributesToDataSuggestionsPipe,
    AttributeFunctionDefinedPipe,
    StripHtmlPipe,
    ArrayReversePipe,
    RoleHumanReadablePipe,
    RemoveSuffixPipe,
    SafeStylePipe,
    ContainsDeletedQueryItemPipe,
    ResourceIconsColorsPipe,
    CleanQueryAttributePipe,
    QueryStemAttributesSelectItemsPipe,
    QueryStemResourcesSelectItemsPipe,
    FilterNotNullPipe,
    UnescapeHtmlPipe,
    IdToReferencePipe,
    FindAttributePipe,
    IsNotNullOrUndefinedPipe,
    ViewsSelectItemsPipe,
    ColumnBackgroundPipe,
    IsDateValidPipe,
    FromNowPipe,
    AttributeResourceTypeToResourceTypePipe,
    LinkTypeOtherCollectionPipe,
    StateListConstraintPipe,
    TruncatePipe,
    AreObjectsEqualPipe,
    AttributeTitlePipe,
    ModifyAttributeForQueryFilterPipe,
    StateListDataValuePipe,
    CanCreateLinksPipe,
  ],
})
export class PipesModule {}
