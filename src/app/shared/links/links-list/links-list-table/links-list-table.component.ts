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

import {Component, Input} from '@angular/core';

@Component({
  selector: 'links-list-table',
  templateUrl: './links-list-table.component.html',
  styleUrls: ['./links-list-table.component.scss']
})
export class LinksListTableComponent {

  public data = [
    { 'Attr1': 'Sed ut', 'Attr2': 10, 'Attr3': ' perspiciatis unde omnis iste natus', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'error sit', 'Attr2': 1, 'Attr3': ' perspiciatis unde omnis iste natus', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'voluptatem', 'Attr2': 32, 'Attr3': 'et quasi architecto beatae vitae dicta', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'accusantium', 'Attr2': 16, 'Attr3': 'voluptatem sequi nesciunt. Neque porro', 'Attr4': 'Quis autem vel'},
    { 'Attr1': 'doloremque', 'Attr2': 98, 'Attr3': ' perspiciatis unde omnis iste natus', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'laudantium', 'Attr2': 456, 'Attr3': 'quaerat voluptatem. Ut enim', 'Attr4': 'dolor sit amet'},
    { 'Attr1': 'eaque', 'Attr2': 78, 'Attr3': ' perspiciatis unde omnis iste natus', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'ipsa quae', 'Attr2': 23, 'Attr3': 'nisi ut aliquid ex ea commodi consequatur?', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'ab illo', 'Attr2': 65, 'Attr3': ' perspiciatis unde omnis iste natus', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'inventore', 'Attr2': 84, 'Attr3': 'in ea voluptate velit esse quam nihil', 'Attr4': 'vel illum qui dolorem'},
    { 'Attr1': 'veritatis', 'Attr2': 72, 'Attr3': ' perspiciatis unde omnis iste natus', 'Attr4': 'totam rem aperiam'},
    { 'Attr1': 'et quasi', 'Attr2': 39, 'Attr3': 'corporis suscipit laboriosam, nisi', 'Attr4': 'totam rem aperiam'}
  ];

  public attributes = [ 'Attr1', 'Attr2', 'Attr3', 'Attr4', 'Some really very long attribute that does not fit the space'];

  @Input()
  public linkName: string = 'Name1';

  @Input()
  public collectionName: string = 'Collection1';

  @Input()
  public collectionIcon: string = 'fas fa-curling';

  @Input()
  public collectionColor: string = '#f6b26b';

  @Input()
  public linkIcons: string[] = ['fas fa-cubes', 'fas fa-curling'];

  @Input()
  public linkColors: string[] = ['#e06666', '#f6b26b'];

  @Input()
  public linkAttrCount = 2;

  public openLinked(idx) {
    // TODO
  }
}
