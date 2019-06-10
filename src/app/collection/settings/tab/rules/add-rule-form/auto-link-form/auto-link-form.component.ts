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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'auto-link-form',
  templateUrl: './auto-link-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoLinkFormComponent implements OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public form: FormGroup;

  public selectedLinkType: LinkType;

  public linkedCollection: Collection;

  @Input()
  public linkTypes: LinkType[];

  public attribute1Empty: string;
  public attribute2Empty: string = '';
  public attribute2NoCollection: string;

  constructor(public i18n: I18n) {}

  public ngOnInit(): void {
    this.attribute1Empty = this.i18n(
      {
        id: 'collection.config.tab.rules.autoLink.selectFrom',
        value: 'Select from {{collection}}',
      },
      {
        collection: this.collection.name,
      }
    );
    this.attribute2NoCollection = this.i18n({
      id: 'collection.config.tab.rules.autoLink.linkTypeFirst',
      value: 'Select link type first',
    });

    const linkTypeId = this.form.get('linkType').value;
    if (linkTypeId) {
      this.onSelectLinkType(linkTypeId);
    }
  }

  public get attribute1Id(): string {
    return this.form.get('attribute1').value;
  }

  public get attribute2Id(): string {
    return this.form.get('attribute2').value;
  }

  public get linkTypeId(): string {
    return this.form.get('linkType').value;
  }

  public onSelectLinkType(linkTypeId: string) {
    this.selectedLinkType = this.linkTypes.find(linkType => linkType.id === linkTypeId);
    this.form.get('linkType').setValue(linkTypeId);
    this.form.get('collection1').setValue(this.collection.id);
    this.linkedCollection =
      this.selectedLinkType.collections[0].id === this.collection.id
        ? this.selectedLinkType.collections[1]
        : this.selectedLinkType.collections[0];
    this.form.get('collection2').setValue(this.linkedCollection.id);

    this.attribute2Empty = this.i18n(
      {
        id: 'collection.config.tab.rules.autoLink.selectFrom',
        value: 'Select from {{collection}}',
      },
      {
        collection: this.linkedCollection.name,
      }
    );
  }

  public onSelectAttribute1(attribute1: string) {
    this.form.get('attribute1').setValue(attribute1);
  }

  public onSelectAttribute2(attribute2: string) {
    this.form.get('attribute2').setValue(attribute2);
  }
}
