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

import {NgZone} from '@angular/core';
import {PostItLayoutConfig} from './post-it-layout-config';

export class PostItLayout {

  constructor(protected containerClassName: string, protected parameters: PostItLayoutConfig, protected zone: NgZone) {
    this.addContainerClassIdentifierIfMissing();
  }

  private addContainerClassIdentifierIfMissing(): void {
    if (!this.containerClassName.startsWith('.')) {
      this.containerClassName = '.' + this.containerClassName;
    }
  }

  public refresh(): void {
    setTimeout(() => {
      if (!this.containerExists()) {
        return;
      }

      this.zone.runOutsideAngular(() => {
        new window['Muuri'](this.containerClassName, this.parameters);
      });
    });
  }

  protected containerExists(): boolean {
    return !!(document.querySelector(this.containerClassName));
  }

  //   var grid = null;
  //   var docElem = document.documentElement;
  //   var demo = document.querySelector('.grid-demo');
  //   var gridElement = demo.querySelector('.grid');
  //   var filterField = demo.querySelector('.filter-field');
  //   var searchField = demo.querySelector('.search-field');
  //   var sortField = demo.querySelector('.sort-field');
  //   var layoutField = demo.querySelector('.layout-field');
  //   var addItemsElement = demo.querySelector('.add-more-items');
  //   var characters = 'abcdefghijklmnopqrstuvwxyz';
  //   var filterOptions = ['red', 'blue', 'green'];
  //   var dragOrder = [];
  //   var uuid = 0;
  //   var filterFieldValue;
  //   var sortFieldValue;
  //   var layoutFieldValue;
  //   var searchFieldValue;
  //
  //   //
  //   // Grid helper functions
  //   //
  //
  //   function initDemo() {
  //
  //     initGrid();
  //
  //     // Reset field values.
  //     searchField.value = '';
  //     [sortField, filterField, layoutField].forEach(function (field) {
  //       field.value = field.querySelectorAll('option')[0].value;
  //     });
  //
  //     // Set inital search query, active filter, active sort value and active layout.
  //     searchFieldValue = searchField.value.toLowerCase();
  //     filterFieldValue = filterField.value;
  //     sortFieldValue = sortField.value;
  //     layoutFieldValue = layoutField.value;
  //
  //     // Search field binding.
  //     searchField.addEventListener('keyup', function () {
  //       var newSearch = searchField.value.toLowerCase();
  //       if (searchFieldValue !== newSearch) {
  //         searchFieldValue = newSearch;
  //         filter();
  //       }
  //     });
  //
  //     // Filter, sort and layout bindings.
  //     filterField.addEventListener('change', filter);
  //     sortField.addEventListener('change', sort);
  //     layoutField.addEventListener('change', changeLayout);
  //
  //     // Add/remove items bindings.
  //     addItemsElement.addEventListener('click', addItems);
  //     gridElement.addEventListener('click', function (e) {
  //       if (elementMatches(e.target, '.card-remove, .card-remove i')) {
  //         removeItem(e);
  //       }
  //     });
  //
  //   }
  //
  //   function initGrid() {
  //
  //     var dragCounter = 0;
  //
  //     grid = new Muuri(gridElement, {
  //       items: generateElements(20),
  //       layoutDuration: 400,
  //       layoutEasing: 'ease',
  //       dragEnabled: true,
  //       dragSortInterval: 50,
  //       dragContainer: document.body,
  //       dragStartPredicate: function (item, event) {
  //         var isDraggable = sortFieldValue === 'order';
  //         var isRemoveAction = elementMatches(event.target, '.card-remove, .card-remove i');
  //         return isDraggable && !isRemoveAction ? Muuri.ItemDrag.defaultStartPredicate(item, event) : false;
  //       },
  //       dragReleaseDuration: 400,
  //       dragReleseEasing: 'ease'
  //     })
  //       .on('dragStart', function () {
  //         ++dragCounter;
  //         docElem.classList.add('dragging');
  //       })
  //       .on('dragEnd', function () {
  //         if (--dragCounter < 1) {
  //           docElem.classList.remove('dragging');
  //         }
  //       })
  //       .on('move', updateIndices)
  //       .on('sort', updateIndices);
  //
  //   }
  //
  //   function filter() {
  //
  //     filterFieldValue = filterField.value;
  //     grid.filter(function (item) {
  //       var element = item.getElement();
  //       var isSearchMatch = !searchFieldValue ? true : (element.getAttribute('data-title') || '').toLowerCase().indexOf(searchFieldValue) > -1;
  //       var isFilterMatch = !filterFieldValue ? true : (element.getAttribute('data-color') || '') === filterFieldValue;
  //       return isSearchMatch && isFilterMatch;
  //     });
  //
  //   }
  //
  //   function sort() {
  //
  //     // Do nothing if sort value did not change.
  //     var currentSort = sortField.value;
  //     if (sortFieldValue === currentSort) {
  //       return;
  //     }
  //
  //     // If we are changing from "order" sorting to something else
  //     // let's store the drag order.
  //     if (sortFieldValue === 'order') {
  //       dragOrder = grid.getItems();
  //     }
  //
  //     // Sort the items.
  //     grid.sort(
  //       currentSort === 'title' ? compareItemTitle :
  //         currentSort === 'color' ? compareItemColor :
  //           dragOrder
  //     );
  //
  //     // Update indices and active sort value.
  //     updateIndices();
  //     sortFieldValue = currentSort;
  //
  //   }
  //
  //   function addItems() {
  //
  //     // Generate new elements.
  //     var newElems = generateElements(5);
  //
  //     // Set the display of the new elements to "none" so it will be hidden by
  //     // default.
  //     newElems.forEach(function (item) {
  //       item.style.display = 'none';
  //     });
  //
  //     // Add the elements to the grid.
  //     var newItems = grid.add(newElems);
  //
  //     // Update UI indices.
  //     updateIndices();
  //
  //     // Sort the items only if the drag sorting is not active.
  //     if (sortFieldValue !== 'order') {
  //       grid.sort(sortFieldValue === 'title' ? compareItemTitle : compareItemColor);
  //       dragOrder = dragOrder.concat(newItems);
  //     }
  //
  //     // Finally filter the items.
  //     filter();
  //
  //   }
  //
  //   function removeItem(e) {
  //
  //     var elem = elementClosest(e.target, '.item');
  //     grid.hide(elem, {onFinish: function (items) {
  //         var item = items[0];
  //         grid.remove(item, {removeElements: true});
  //         if (sortFieldValue !== 'order') {
  //           var itemIndex = dragOrder.indexOf(item);
  //           if (itemIndex > -1) {
  //             dragOrder.splice(itemIndex, 1);
  //           }
  //         }
  //       }});
  //     updateIndices();
  //
  //   }
  //
  //   function changeLayout() {
  //
  //     layoutFieldValue = layoutField.value;
  //     grid._settings.layout = {
  //       horizontal: false,
  //       alignRight: layoutFieldValue.indexOf('right') > -1,
  //       alignBottom: layoutFieldValue.indexOf('bottom') > -1,
  //       fillGaps: layoutFieldValue.indexOf('fillgaps') > -1
  //     };
  //     grid.layout();
  //
  //   }
  //
  //   //
  //   // Generic helper functions
  //   //
  //
  //   function generateElements(amount) {
  //
  //     var ret = [];
  //
  //     for (var i = 0; i < amount; i++) {
  //       ret.push(generateElement(
  //         ++uuid,
  //         generateRandomWord(2),
  //         getRandomItem(filterOptions),
  //         getRandomInt(1, 2),
  //         getRandomInt(1, 2)
  //       ));
  //     }
  //
  //     return ret;
  //
  //   }
  //
  //   function generateElement(id, title, color, width, height) {
  //
  //     var itemElem = document.createElement('div');
  //     var classNames = 'item h' + height + ' w' + width + ' ' + color;
  //     var itemTemplate = '' +
  //       '<div class="' + classNames + '" data-id="' + id + '" data-color="' + color + '" data-title="' + title + '">' +
  //       '<div class="item-content">' +
  //       '<div class="card">' +
  //       '<div class="card-id">' + id + '</div>' +
  //       '<div class="card-title">' + title + '</div>' +
  //       '<div class="card-remove"><i class="material-icons">&#xE5CD;</i></div>' +
  //       '</div>' +
  //       '</div>' +
  //       '</div>';
  //
  //     itemElem.innerHTML = itemTemplate;
  //     return itemElem.firstChild;
  //
  //   }
  //
  //   function getRandomItem(collection) {
  //
  //     return collection[Math.floor(Math.random() * collection.length)];
  //
  //   }
  //
  //   function compareItemTitle(a, b) {
  //
  //     var aVal = a.getElement().getAttribute('data-title') || '';
  //     var bVal = b.getElement().getAttribute('data-title') || '';
  //     return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
  //
  //   }
  //
  //   function compareItemColor(a, b) {
  //
  //     var aVal = a.getElement().getAttribute('data-color') || '';
  //     var bVal = b.getElement().getAttribute('data-color') || '';
  //     return aVal < bVal ? -1 : aVal > bVal ? 1 : compareItemTitle(a, b);
  //
  //   }
  //
  //   function updateIndices() {
  //
  //     grid.getItems().forEach(function (item, i) {
  //       item.getElement().setAttribute('data-id', i + 1);
  //       item.getElement().querySelector('.card-id').innerHTML = i + 1;
  //     });
  //
  //   }
  //
  //   function elementMatches(element, selector) {
  //
  //     var p = Element.prototype;
  //     return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector).call(element, selector);
  //
  //   }
  //
  //   function elementClosest(element, selector) {
  //
  //     if (window.Element && !Element.prototype.closest) {
  //       var isMatch = elementMatches(element, selector);
  //       while (!isMatch && element && element !== document) {
  //         element = element.parentNode;
  //         isMatch = element && element !== document && elementMatches(element, selector);
  //       }
  //       return element && element !== document ? element : null;
  //     }
  //     else {
  //       return element.closest(selector);
  //     }
  //
  //   }

}
