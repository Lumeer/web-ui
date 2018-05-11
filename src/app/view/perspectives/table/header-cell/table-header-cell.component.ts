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

import {Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Attribute} from '../../../../core/dto/attribute';
import {Collection} from '../../../../core/dto/collection';
import {LinkType} from '../../../../core/dto/link-type';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {KeyCode} from '../../../../shared/key-code';
import {AttributeHelper} from '../../../../shared/utils/attribute-helper';
import {HtmlModifier} from '../../../../shared/utils/html-modifier';
import {isKeyPrintable} from '../../../../shared/utils/key-code.helper';
import {LinkHelper} from '../../../../shared/utils/link-helper';
import {TableLinkEvent} from '../event/table-link-event';

import {TablePart} from '../model/table-part';
import {TableManagerService} from '../util/table-manager.service';

@Component({
  selector: 'table-header-cell',
  templateUrl: './table-header-cell.component.html',
  styleUrls: ['./table-header-cell.component.scss']
})
export class TableHeaderCellComponent {

  @Input()
  public part: TablePart;

  @Input()
  public attribute: Attribute;

  @Input()
  public embedded: boolean;

  @Output()
  public createAttribute = new EventEmitter();

  @Output()
  public renameAttribute = new EventEmitter();

  @Output()
  public deleteAttribute = new EventEmitter();

  @Output()
  public addLinkedPart = new EventEmitter<TableLinkEvent>();

  @ViewChild('attributeNameInput')
  public attributeNameInput: ElementRef;
  public attributeName = '';

  public editable = true;
  public editMode = false;

  constructor(private notificationService: NotificationService,
              private tableManagerService: TableManagerService) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('attribute')) {
      this.attributeName = this.attribute.name;
    }
  }

  private getRelatedLinks(): [LinkType, Collection][] {
    return LinkHelper.filterRelatedLinkTypes(this.part.collection, this.tableManagerService.linkTypes)
      .map(linkType => {
        const collectionId = LinkHelper.getOtherCollectionId(linkType, this.part.collection.id);
        const collection = this.tableManagerService.collections.find(collection => collection.id === collectionId);

        const relatedLink: [LinkType, Collection] = [linkType, collection];
        return relatedLink;
      });
  }

  public onSort(descending: boolean) {
    this.tableManagerService.sortRows(this.attribute.id, descending);
  }

  public switchEditMode(editMode: boolean) {
    this.editMode = editMode;

    if (editMode) {
      this.attributeNameInput.nativeElement.focus();
      HtmlModifier.setCursorAtTextContentEnd(this.attributeNameInput.nativeElement);
    } else {
      this.saveAttributeChanges();
    }
  }

  private saveAttributeChanges() {
    const oldName = this.attribute.name;
    const newName = this.attributeNameInput.nativeElement.textContent.trim();

    if (newName && newName !== oldName) {
      this.attribute.name = newName;

      this.renameAttribute.emit({part: this.part, attribute: this.attribute});
    }
  }

  public onHideColumn() {
    this.tableManagerService.hideColumn(this.part, this.attribute);
  }

  public onDoubleClick() {
    if (!this.editMode) {
      this.switchEditMode(true);
    }
  }

  public onFocus() {
    this.initNextColumn();
  }

  private initNextColumn() {
    if (this.isSinglePart() && this.isLastAttribute()) {
      this.tableManagerService.addColumn(this.part, this.attribute);
    }
  }

  private isSinglePart() {
    return this.part.index === 0 && !this.part.nextPart;
  }

  private isLastAttribute() {
    return this.part.shownAttributes.indexOf(this.attribute) === this.part.shownAttributes.length - 1;
  }

  public onBlur() {
    if (this.editMode) {
      this.switchEditMode(false);
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    if (this.editMode) {
      this.onKeyDownInEditMode(event);
    } else {
      this.onKeyDownInSelectionMode(event);
    }
  }

  private onKeyDownInSelectionMode(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.Backspace:
        this.switchEditMode(true);
        event.preventDefault();
        return;
      case KeyCode.Delete:
        this.confirmRemove();
        return;
      default:
        if (!isKeyPrintable(event.keyCode)) {
          return;
        }

        event.preventDefault();
        this.switchEditMode(true);
    }
  }

  private onKeyDownInEditMode(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.Escape:
        this.switchEditMode(false);
        event.preventDefault();
        return;
    }
  }

  public onKeyUp(event: KeyboardEvent) {
    if (this.editMode) {
      this.attributeName = this.attributeNameInput.nativeElement.textContent;
    }
  }

  public onAddColumn() {
    this.tableManagerService.addColumn(this.part, this.attribute);
  }

  public onAddSubColumn() {
    this.tableManagerService.addSubColumn(this.part, this.attribute);
  }

  public onRemoveColumn() {
    if (AttributeHelper.isAttributeInitialized(this.attribute)) {
      this.confirmRemove();
    } else {
      this.tableManagerService.removeColumn(this.part, this.attribute);
    }
  }

  public confirmRemove() {
    this.notificationService.confirm(
      'Deleting a column will permanently remove the attribute from the file.',
      'Delete this column?',
      [
        {text: 'Yes', action: () => this.onDeleteAttribute(), bold: false},
        {text: 'No'}
      ]
    );
  }

  public onDeleteAttribute() {
    this.tableManagerService.removeColumn(this.part, this.attribute);

    this.deleteAttribute.emit();
  }

  public suggestExistingLinks(prefix: string): [LinkType, Collection, Attribute][] {
    // TODO do not get from the server
    return this.getRelatedLinks().reduce<[LinkType, Collection, Attribute][]>((linkedAttributes, [linkType, collection]) => {
      const newLinkedAttributes = AttributeHelper.getAttributesByPrefix(prefix, collection)
        .map<[LinkType, Collection, Attribute]>(([c, a]) => [linkType, c, a]);

      return linkedAttributes.concat(newLinkedAttributes);
    }, []);
  }

  public suggestNewLinks(prefix: string): [Collection, Attribute][] {
    return AttributeHelper.getAttributesByPrefix(prefix, ...this.tableManagerService.collections);
  }

  public createNewAttribute() {
    this.createAttribute.emit();
  }

  public useExistingLink([linkType, collection, attribute]: [LinkType, Collection, Attribute]) {
    this.addLinkedPart.emit({linkType: linkType, collection: collection, attribute: attribute});
  }

  public createNewLink([collection, attribute]: [Collection, Attribute]) {
    this.addLinkedPart.emit({linkType: null, collection: collection, attribute: attribute});
  }

}
