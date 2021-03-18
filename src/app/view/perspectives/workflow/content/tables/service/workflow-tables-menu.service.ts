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

import {Injectable} from '@angular/core';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {TableColumn} from '../../../../../../shared/table/model/table-column';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {isMacOS} from '../../../../../../shared/utils/system.utils';
import {MenuItem} from '../../../../../../shared/menu/model/menu-item';
import {ConstraintType} from '@lumeer/data-filters';

export enum HeaderMenuId {
  Edit = 'edit',
  Type = 'type',
  Function = 'function',
  Description = 'description',
  Hide = 'hide',
  Copy = 'copy',
  CopyName = 'copyName',
  CopyValues = 'copyValues',
  CopyValuesUnique = 'copyValuesUnique',
  Displayed = 'displayed',
  Delete = 'delete',
  AddToRight = 'addToRight',
  AddToLeft = 'addToLeft',
  AddLinkColumn = 'addLinkColumn',
  Rule = 'rule',
}

export enum RowMenuId {
  Edit = 'edit',
  Detail = 'detail',
  Copy = 'copy',
  Delete = 'delete',
  Unlink = 'unlink',
}

@Injectable()
export class WorkflowTablesMenuService {
  public readonly macOS = isMacOS();

  public createRowMenu(permissions: AllowedPermissions, row: TableRow, linked?: boolean): MenuItem[] {
    const items: MenuItem[] = [
      {
        id: RowMenuId.Edit,
        title: this.translateRowMenuItem(RowMenuId.Edit),
        disabled: !permissions?.manageWithView,
        icons: ['fa fa-edit'],
        shortcut: this.macOS ? '↩' : 'Enter',
        group: 0,
      },
    ];

    if (row.documentId) {
      items.push({
        id: RowMenuId.Detail,
        title: this.translateRowMenuItem(RowMenuId.Detail),
        disabled: !permissions?.read,
        icons: ['far fa-file-search'],
        group: 0,
      });
    }

    items.push({
      id: RowMenuId.Copy,
      title: this.translateRowMenuItem(RowMenuId.Copy),
      disabled: false,
      icons: ['far fa-copy'],
      shortcut: this.macOS ? '⌘ C' : 'Ctrl + C',
      group: 0,
    });

    if (row.documentId) {
      if (linked) {
        items.push({
          id: RowMenuId.Unlink,
          title: this.translateRowMenuItem(RowMenuId.Unlink),
          disabled: !permissions?.writeWithView,
          icons: ['fa fa-unlink text-warning'],
          group: 1,
        });
      } else {
        items.push({
          id: RowMenuId.Delete,
          title: this.translateRowMenuItem(RowMenuId.Delete),
          disabled: !permissions?.writeWithView,
          icons: ['far fa-trash-alt text-danger'],
          group: 1,
        });
      }
    }

    return items;
  }

  private translateRowMenuItem(id: string): string {
    switch (id) {
      case RowMenuId.Edit:
        return $localize`:@@table.body.row.edit:Edit value`;
      case RowMenuId.Detail:
        return $localize`:@@table.body.row.show.detail:Show detail`;
      case RowMenuId.Copy:
        return $localize`:@@table.body.row.copy.value:Copy value`;
      case RowMenuId.Delete:
        return $localize`:@@remove.row:Remove row`;
      case RowMenuId.Unlink:
        return $localize`:@@table.body.row.unlink:Unlink row`;
      default:
        return '';
    }
  }

  public createHeaderMenu(
    permissions: AllowedPermissions,
    column: TableColumn,
    configurable: boolean,
    otherPermissions?: AllowedPermissions
  ): MenuItem[] {
    const items: MenuItem[] = [
      {
        id: HeaderMenuId.Edit,
        title: this.translateHeaderMenuItem(HeaderMenuId.Edit),
        disabled: !permissions?.manageWithView,
        icons: ['fa fa-edit'],
        group: 0,
      },
    ];

    if (column.attribute?.id) {
      items.push(
        {
          id: HeaderMenuId.Type,
          title: this.translateHeaderMenuItem(HeaderMenuId.Type),
          disabled: !permissions?.manageWithView,
          icons: ['fa fa-shapes'],
          group: 0,
        },
        {
          id: HeaderMenuId.Function,
          title: this.translateHeaderMenuItem(
            column.attribute?.constraint?.type === ConstraintType.Action ? HeaderMenuId.Rule : HeaderMenuId.Function
          ),
          disabled: !permissions?.manageWithView,
          icons: ['fa fa-function'],
          group: 0,
        },
        {
          id: HeaderMenuId.Description,
          title: this.translateHeaderMenuItem(HeaderMenuId.Description),
          disabled: !permissions?.manageWithView,
          icons: ['fa fa-file-edit'],
          group: 1,
        }
      );
    }
    items.push({
      id: HeaderMenuId.Copy,
      title: this.translateHeaderMenuItem(HeaderMenuId.Copy),
      disabled: false,
      icons: ['far fa-copy'],
      selectDisabled: true,
      children: [
        {
          id: HeaderMenuId.CopyName,
          title: this.translateHeaderMenuItem(HeaderMenuId.CopyName),
          disabled: false,
          shortcut: this.macOS ? '⌘ C' : 'Ctrl + C',
        },
        {
          id: HeaderMenuId.CopyValues,
          title: this.translateHeaderMenuItem(HeaderMenuId.CopyValues),
          disabled: false,
        },
        {
          id: HeaderMenuId.CopyValuesUnique,
          title: this.translateHeaderMenuItem(HeaderMenuId.CopyValuesUnique),
          disabled: false,
        },
      ],
    });

    if (column.attribute?.id && !column.default && column.collectionId) {
      items.push({
        id: HeaderMenuId.Displayed,
        title: this.translateHeaderMenuItem(HeaderMenuId.Displayed),
        disabled: !permissions?.manageWithView,
        icons: ['fa fa-check-square'],
        group: 1,
      });
    }

    items.push({
      id: HeaderMenuId.AddToLeft,
      title: this.translateHeaderMenuItem(HeaderMenuId.AddToLeft),
      disabled: !permissions?.manageWithView,
      icons: ['fa fa-arrow-alt-circle-left'],
      group: 2,
    });

    items.push({
      id: HeaderMenuId.AddToRight,
      title: this.translateHeaderMenuItem(HeaderMenuId.AddToRight),
      disabled: !permissions?.manageWithView,
      icons: ['fa fa-arrow-alt-circle-right'],
      group: 2,
    });

    if (column.collectionId && otherPermissions?.manageWithView) {
      items.push({
        id: HeaderMenuId.AddLinkColumn,
        title: this.translateHeaderMenuItem(HeaderMenuId.AddLinkColumn),
        disabled: false,
        icons: ['fa fa-link'],
        group: 2,
      });
    }

    if (column.attribute?.id) {
      items.push({
        id: HeaderMenuId.Hide,
        title: this.translateHeaderMenuItem(HeaderMenuId.Hide),
        disabled: !configurable,
        icons: ['fa fa-eye-slash'],
        group: 3,
      });
    }

    items.push({
      id: HeaderMenuId.Delete,
      title: this.translateHeaderMenuItem(HeaderMenuId.Delete),
      disabled: !permissions?.manageWithView,
      icons: ['far fa-trash-alt text-danger'],
      group: 3,
    });

    return items;
  }

  private translateHeaderMenuItem(id: string): string {
    switch (id) {
      case HeaderMenuId.Edit:
        return $localize`:@@table.header.menu.edit:Edit name`;
      case HeaderMenuId.Type:
        return $localize`:@@table.header.menu.changeAttribute:Attribute settings...`;
      case HeaderMenuId.Function:
        return $localize`:@@table.header.menu.editFunction:Edit function...`;
      case HeaderMenuId.Description:
        return $localize`:@@table.header.menu.editDescription:Edit description...`;
      case HeaderMenuId.Rule:
        return $localize`:@@table.header.menu.editAutomation:Edit automation...`;
      case HeaderMenuId.Displayed:
        return $localize`:@@table.header.menu.defaultAttribute:Set as displayed attribute`;
      case HeaderMenuId.Hide:
        return $localize`:@@table.header.menu.hide:Hide column`;
      case HeaderMenuId.Copy:
        return $localize`:@@copy:Copy`;
      case HeaderMenuId.CopyName:
        return $localize`:@@resource.attribute.name:Copy column name`;
      case HeaderMenuId.CopyValues:
        return $localize`:@@table.header.menu.copy.values:Copy all column values`;
      case HeaderMenuId.CopyValuesUnique:
        return $localize`:@@table.header.menu.copy.values.unique:Copy unique column values`;
      case HeaderMenuId.Delete:
        return $localize`:@@table.header.menu.remove:Delete column`;
      case HeaderMenuId.AddToLeft:
        return $localize`:@@table.header.menu.add.column.next:Add column right`;
      case HeaderMenuId.AddToRight:
        return $localize`:@@table.header.menu.add.column.previous:Add column left`;
      case HeaderMenuId.AddLinkColumn:
        return $localize`:@@table.header.menu.add.linkColumn:Add Link column`;
      default:
        return '';
    }
  }
}
