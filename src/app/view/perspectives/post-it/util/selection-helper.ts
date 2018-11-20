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

import {AttributePropertySelection} from '../document-data/attribute-property-selection';
import {isNullOrUndefined} from 'util';
import {BehaviorSubject} from 'rxjs';

export const ATTRIBUTE_COLUMN = 0;

export const VALUE_COLUMN = 1;

export class SelectionHelper {
  private selection: AttributePropertySelection = this.emptySelection();

  constructor(
    private postItsOrder$: BehaviorSubject<string[]>,
    private documentNumRows: (key: string) => number,
    private documentsPerRow: () => number,
    private perspectiveId: string
  ) {}

  public clearSelection() {
    this.selection = this.emptySelection();
  }

  public moveUp() {
    if (this.isEmptySelection()) {
      return;
    }

    const newRow = this.selection.row - 1;
    const newColumn = this.selection.column;

    if (newRow >= 0) {
      this.focusCurrent(newRow, newColumn);
    } else {
      // now we need select post-it above
      const index = this.selection.index - 1;
      if (index >= 0) {
        const currentParentElement = this.getCurrentFocusedParentElement();
        if (currentParentElement) {
          const parentRect = currentParentElement.getBoundingClientRect();
          const {parentElement, key} = this.findParentElementToFocusVertically(
            index,
            0,
            parentRect.left,
            parentRect.right,
            true
          );
          if (parentElement && key) {
            this.focus(this.documentNumRows(key), newColumn, key, false);
          }
        }
      }
    }
  }

  public moveDown() {
    if (this.isEmptySelection()) {
      return;
    }

    const newRow = this.selection.row + 1;
    const newColumn = this.selection.column;

    if (newRow <= this.currentLastRowIndex()) {
      this.focusCurrent(newRow, newColumn);
    } else {
      // now we need select post-it below
      const index = this.selection.index + 1;
      if (index < this.postItsOrder$.getValue().length) {
        const currentParentElement = this.getCurrentFocusedParentElement();
        if (currentParentElement) {
          const parentRect = currentParentElement.getBoundingClientRect();
          const {parentElement, key} = this.findParentElementToFocusVertically(
            index,
            this.postItsOrder$.getValue().length - 1,
            parentRect.left,
            parentRect.right,
            false
          );
          if (parentElement && key) {
            this.focus(0, newColumn, key, false);
          }
        }
      }
    }
  }

  public moveRight() {
    if (this.isEmptySelection()) {
      return;
    }

    const newRow = this.selection.row;
    const newColumn = this.selection.column + 1;

    if (newColumn <= VALUE_COLUMN) {
      this.focusCurrent(newRow, newColumn);
    } else {
      // we need to select post-it on the right
      const currentParentElement = this.getCurrentFocusedParentElement();
      const currentElement = this.getCurrentFocusedElement();
      if (currentParentElement && currentElement) {
        const parentRect = currentParentElement.getBoundingClientRect();
        const rect = currentElement.getBoundingClientRect();
        const {parentElement, key} = this.findParentElementToFocusHorizontally(
          this.selection.index,
          parentRect.right,
          parentRect.right + parentRect.width,
          rect.top,
          rect.bottom
        );
        if (parentElement && key) {
          const {element, row} = this.findElementToFocus(
            parentElement,
            ATTRIBUTE_COLUMN,
            rect.bottom - (rect.bottom - rect.top) / 2
          );
          if (element && !isNullOrUndefined(row)) {
            this.focusElement(element, row, ATTRIBUTE_COLUMN, key, false);
          }
        }
      }
    }
  }

  public moveLeft() {
    if (this.isEmptySelection()) {
      return;
    }

    const newRow = this.selection.row;
    const newColumn = this.selection.column - 1;

    if (newColumn >= ATTRIBUTE_COLUMN) {
      this.focusCurrent(newRow, newColumn);
    } else {
      // we need to select post-it on the left
      const currentParentElement = this.getCurrentFocusedParentElement();
      const currentElement = this.getCurrentFocusedElement();
      if (currentParentElement && currentElement) {
        const parentRect = currentParentElement.getBoundingClientRect();
        const rect = currentElement.getBoundingClientRect();
        const {parentElement, key} = this.findParentElementToFocusHorizontally(
          this.selection.index,
          parentRect.left - parentRect.width,
          parentRect.left,
          rect.top,
          rect.bottom
        );
        if (parentElement && key) {
          const {element, row} = this.findElementToFocus(
            parentElement,
            VALUE_COLUMN,
            rect.bottom - (rect.bottom - rect.top) / 2
          );
          if (element && !isNullOrUndefined(row)) {
            this.focusElement(element, row, VALUE_COLUMN, key, false);
          }
        }
      }
    }
  }

  public moveToNextInput() {
    if (this.isEmptySelection()) {
      return;
    }

    let newColumn = this.selection.column + 1;
    let newRow = this.selection.row;
    if (newColumn > VALUE_COLUMN) {
      newColumn = ATTRIBUTE_COLUMN;
      newRow += 1;
    }

    if (newRow <= this.currentLastRowIndex()) {
      this.focus(newRow, newColumn, this.selection.key, true);
    } else {
      // now we need select post-it below
      const index = this.selection.index + 1;
      if (index < this.postItsOrder$.getValue().length) {
        this.focus(0, ATTRIBUTE_COLUMN, this.postItsOrder$.getValue()[index], true);
      }
    }
  }

  public focusToggle(input: boolean) {
    if (this.isEmptySelection()) {
      return;
    }

    this.focus(this.selection.row, this.selection.column, this.selection.key, input);
  }

  public focusCellSpan(row: number, column: number, key: string) {
    this.focus(row, column, key, false);
  }

  private focusCurrent(row: number, column: number) {
    this.focusCellSpan(row, column, this.selection.key);
  }

  public focusInputIfNeeded(key: string) {
    if (this.selection.key !== key) {
      this.focus(0, VALUE_COLUMN, key, true);
    }
  }

  private focusElement(element: HTMLElement, row: number, column: number, key: string, input: boolean) {
    let elementToFocus = element;

    if (input) {
      elementToFocus = elementToFocus.getElementsByTagName('Input').item(0) as HTMLElement;
    }

    if (elementToFocus) {
      elementToFocus.focus();

      this.selection.row = row;
      this.selection.column = column;
      this.selection.index = this.postItsOrder$.getValue().findIndex(ord => ord === key);
      this.selection.key = key;
    }
  }

  private focus(row: number, column: number, key: string, input: boolean) {
    const cellId = this.getCellId(row, column, key);
    const elementToFocus = document.getElementById(cellId);
    if (elementToFocus) {
      this.focusElement(elementToFocus, row, column, key, input);
    }
  }

  private findElementToFocus(
    parentElement: HTMLElement,
    column: number,
    y: number
  ): {element: HTMLElement | null; row: number} {
    const elements = parentElement.getElementsByTagName('post-it-document-cell');
    let minDistance = Number.MAX_SAFE_INTEGER;
    let minDistanceElement: HTMLElement;
    let minDistanceRow: number;
    for (let i = 0; i < elements.length; i++) {
      const el = elements.item(i) as HTMLElement;
      const rect = el.getBoundingClientRect();
      const idSplit = el.id.split('#', 4);
      const elColumn = +idSplit[2];

      if (elColumn === column) {
        const elY = rect.bottom - (rect.bottom - rect.top) / 2;
        const distance = Math.abs(elY - y);
        if (distance < minDistance) {
          minDistance = distance;
          minDistanceRow = +idSplit[3];
          minDistanceElement = el;
        }
      }
    }

    return {element: minDistanceElement, row: minDistanceRow};
  }

  private findParentElementToFocusHorizontally(
    excludeIndex: number,
    fromX: number,
    toX: number,
    fromY: number,
    toY: number
  ): {parentElement: HTMLElement | null; key: string | null} {
    const keys = this.postItsOrder$.getValue();
    const y = fromY - (fromY - toY) / 2;
    let minDistance = Number.MAX_SAFE_INTEGER;
    let minDistanceElement: HTMLElement;
    let minDistanceKey: string;

    for (let i = 0; i < keys.length; i++) {
      if (i === excludeIndex) {
        continue;
      }
      const key = keys[i];
      const el = document.getElementById(this.getParentId(key));
      if (el) {
        const rect = el.getBoundingClientRect();
        if (fromX === rect.left && toX === rect.right) {
          if (this.isIntersecting(rect.top, rect.bottom, fromY, toY)) {
            return {parentElement: el, key};
          } else {
            // try to find nearest post-it
            const distance = Math.min(Math.abs(rect.top - y), Math.abs(rect.bottom - y));
            if (distance < minDistance) {
              minDistance = distance;
              minDistanceElement = el;
              minDistanceKey = key;
            }
          }
        }
      }
    }

    return {parentElement: minDistanceElement, key: minDistanceKey};
  }

  private findParentElementToFocusVertically(
    fromIndex: number,
    toIndex: number,
    left: number,
    right: number,
    up?: boolean
  ): {parentElement: HTMLElement | null; key: string | null} {
    const keys = this.postItsOrder$.getValue();
    for (let i = fromIndex; up ? i >= toIndex : i <= toIndex; up ? i-- : i++) {
      const key = keys[i];
      const el = document.getElementById(this.getParentId(key));
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.left === left && rect.right === right) {
          return {parentElement: el, key};
        }
      }
    }

    return {parentElement: null, key: null};
  }

  private isIntersecting(from: number, to: number, a1: number, a2: number): boolean {
    return (a1 >= from && a1 <= to) || (a2 >= from && a2 <= to);
  }

  private getCurrentFocusedParentElement(): HTMLElement | null {
    return document.getElementById(this.getParentId(this.selection.key));
  }

  private getCurrentFocusedElement(): HTMLElement | null {
    return document.getElementById(this.getCellId(this.selection.row, this.selection.column, this.selection.key));
  }

  private getParentId(key: string) {
    return `${this.perspectiveId}#${key}`;
  }

  private getCellId(row: number, column: number, key: string): string {
    return `${this.getParentId(key)}#${column}#${row}`;
  }

  private isEmptySelection(): boolean {
    return JSON.stringify(this.selection) === JSON.stringify(this.emptySelection());
  }

  private currentLastRowIndex(): number {
    return this.documentNumRows(this.selection.key);
  }

  private emptySelection(): AttributePropertySelection {
    return {row: null, column: null, index: null, key: null};
  }
}
