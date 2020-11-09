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
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {TableColumn, TableContextMenuItem} from '../../../../../../shared/table/model/table-column';
import {TableRow} from '../../../../../../shared/table/model/table-row';
import {isMacOS} from '../../../../../../shared/utils/system.utils';

export enum HeaderMenuId {
  Edit = 'edit',
  Type = 'type',
  Function = 'function',
  Hide = 'hide',
  Displayed = 'displayed',
  Delete = 'delete',
  AddToRight = 'addToRight',
  AddToLeft = 'addToLeft',
  AddLinkColumn = 'addLinkColumn',
}

export enum RowMenuId {
  Edit = 'edit',
  Detail = 'detail',
  Delete = 'delete',
  Unlink = 'unlink',
}

@Injectable()
export class WorkflowTablesMenuService {
  public readonly macOS = isMacOS();

  constructor(private i18n: I18n) {}

  public createRowMenu(permissions: AllowedPermissions, row: TableRow, linked?: boolean): TableContextMenuItem[] {
    const items: TableContextMenuItem[] = [
      {
        id: RowMenuId.Edit,
        title: this.translateRowMenuItem(RowMenuId.Edit),
        disabled: !permissions?.manageWithView,
        iconClass: 'fa fa-edit',
        shortcut: this.macOS ? '↩' : 'Enter',
        group: 0,
      },
    ];

    if (row.documentId) {
      items.push({
        id: RowMenuId.Detail,
        title: this.translateRowMenuItem(RowMenuId.Detail),
        disabled: !permissions?.read,
        iconClass: 'fa fa-file-search',
        group: 0,
      });

      if (linked) {
        items.push({
          id: RowMenuId.Unlink,
          title: this.translateRowMenuItem(RowMenuId.Unlink),
          disabled: !permissions?.writeWithView,
          iconClass: 'fa fa-unlink text-warning',
          group: 1,
        });
      } else {
        items.push({
          id: RowMenuId.Delete,
          title: this.translateRowMenuItem(RowMenuId.Delete),
          disabled: !permissions?.writeWithView,
          iconClass: 'fa fa-trash text-danger',
          group: 1,
        });
      }
    }

    return items;
  }

  private translateRowMenuItem(id: string): string {
    switch (id) {
      case RowMenuId.Edit:
        return this.i18n({id: 'table.body.row.edit', value: 'Edit value'});
      case RowMenuId.Detail:
        return this.i18n({id: 'table.body.row.show.detail', value: 'Show detail'});
      case RowMenuId.Delete:
        return this.i18n({id: 'remove.row', value: 'Remove row'});
      case RowMenuId.Unlink:
        return this.i18n({id: 'table.body.row.unlink', value: 'Unlink row'});
      default:
        return '';
    }
  }

  public createHeaderMenu(
    permissions: AllowedPermissions,
    column: TableColumn,
    configurable: boolean,
    otherPermissions?: AllowedPermissions
  ): TableContextMenuItem[] {
    const items: TableContextMenuItem[] = [
      {
        id: HeaderMenuId.Edit,
        title: this.translateHeaderMenuItem(HeaderMenuId.Edit),
        disabled: !permissions?.manageWithView,
        iconClass: 'fa fa-edit',
        group: 0,
      },
    ];

    if (column.attribute?.id) {
      items.push(
        {
          id: HeaderMenuId.Type,
          title: this.translateHeaderMenuItem(HeaderMenuId.Type),
          disabled: !permissions?.manageWithView,
          iconClass: 'fa fa-shapes',
          group: 0,
        },
        {
          id: HeaderMenuId.Function,
          title: this.translateHeaderMenuItem(HeaderMenuId.Function),
          disabled: !permissions?.manageWithView,
          iconClass: 'fa fa-function',
          group: 0,
        }
      );
    }

    if (column.attribute?.id && !column.default && column.collectionId) {
      items.push({
        id: HeaderMenuId.Displayed,
        title: this.translateHeaderMenuItem(HeaderMenuId.Displayed),
        disabled: !permissions?.manageWithView,
        iconClass: 'fa fa-check-square',
        group: 1,
      });
    }

    items.push({
      id: HeaderMenuId.AddToLeft,
      title: this.translateHeaderMenuItem(HeaderMenuId.AddToLeft),
      disabled: !permissions?.manageWithView,
      iconClass: 'fa fa-arrow-alt-circle-left',
      group: 2,
    });

    items.push({
      id: HeaderMenuId.AddToRight,
      title: this.translateHeaderMenuItem(HeaderMenuId.AddToRight),
      disabled: !permissions?.manageWithView,
      iconClass: 'fa fa-arrow-alt-circle-right',
      group: 2,
    });

    if (column.collectionId && otherPermissions?.manageWithView) {
      items.push({
        id: HeaderMenuId.AddLinkColumn,
        title: this.translateHeaderMenuItem(HeaderMenuId.AddLinkColumn),
        disabled: false,
        iconClass: 'fa fa-link',
        group: 2,
      });
    }

    if (column.attribute?.id) {
      items.push({
        id: HeaderMenuId.Hide,
        title: this.translateHeaderMenuItem(HeaderMenuId.Hide),
        disabled: !configurable,
        iconClass: 'fa fa-eye-slash',
        group: 3,
      });
    }

    items.push({
      id: HeaderMenuId.Delete,
      title: this.translateHeaderMenuItem(HeaderMenuId.Delete),
      disabled: !permissions?.manageWithView,
      iconClass: 'fa fa-trash text-danger',
      group: 3,
    });

    return items;
  }

  private translateHeaderMenuItem(id: string): string {
    switch (id) {
      case HeaderMenuId.Edit:
        return this.i18n({id: 'table.header.menu.edit', value: 'Edit name'});
      case HeaderMenuId.Type:
        return this.i18n({id: 'table.header.menu.changeType', value: 'Attribute type...'});
      case HeaderMenuId.Function:
        return this.i18n({id: 'table.header.menu.editFunction', value: 'Edit function...'});
      case HeaderMenuId.Displayed:
        return this.i18n({id: 'table.header.menu.defaultAttribute', value: 'Set as displayed attribute'});
      case HeaderMenuId.Hide:
        return this.i18n({id: 'table.header.menu.hide', value: 'Hide column'});
      case HeaderMenuId.Delete:
        return this.i18n({id: 'table.header.menu.remove', value: 'Delete column'});
      case HeaderMenuId.AddToRight:
        return this.i18n({id: 'table.header.menu.add.column.next', value: 'Add column left'});
      case HeaderMenuId.AddToLeft:
        return this.i18n({id: 'table.header.menu.add.column.previous', value: 'Add column right'});
      case HeaderMenuId.AddLinkColumn:
        return this.i18n({id: 'table.header.menu.add.linkColumn', value: 'Add Link column'});
      default:
        return '';
    }
  }
}
