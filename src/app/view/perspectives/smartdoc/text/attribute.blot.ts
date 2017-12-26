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

declare const QuillEditor: any;
const Parchment = QuillEditor.import('parchment');

let Embed = QuillEditor.import('blots/embed');

let Color = new Parchment.Attributor.Style('color', 'color', {
  whitelist: ['#18bc9c']
});
Parchment.register(Color);

export class AttributeBlot extends Embed {

  public static blotName = 'attribute';
  public static className = 'attribute';
  public static tagName = 'span';

  public static create(value: any): Node {
    const attribute: { id: string, value: any } = value;
    const node: Node = super.create(attribute.value);

    node.textContent = attribute.value;

    node['dataset'].attributeId = attribute.id;
    node['dataset'].attributeValue = attribute.value;

    Color.add(node, '#18bc9c');
    return node;
  }

  public format(name, value) {
    if (name === this.blotName && value) {
      this.domNode['dataset'].attributeId = value.id;
      this.domNode['dataset'].attributeValue = value.value;
    } else {
      super.format(name, value);
    }
  }

  public static value(domNode: Node): any {
    return {
      id: domNode['dataset'].attributeId,
      value: domNode['dataset'].attributeValue
    };
  }

}
