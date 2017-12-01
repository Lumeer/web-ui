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

import {Perspective} from '../../../view/perspectives/perspective';

export enum TemplatePartType {
  Attachments = 'attachments',
  Embedded = 'embedded',
  Text = 'text'
}

export interface TemplatePartModel {

  type: TemplatePartType;

  text?: string;

  linkTypeId?: string;
  perspective?: Perspective;
  templateId?: string;

}

export interface TemplateModel {

  id?: string;
  collectionCode: string;

  parts: TemplatePartModel[];

  correlationId?: string;

}

export function mergeTextParts(parts: TemplatePartModel[]) {
  for (let i = parts.length - 1; i > 0; i--) {
    if (parts[i].type === TemplatePartType.Text && parts[i - 1].type === TemplatePartType.Text) {
      const part: TemplatePartModel = {
        type: TemplatePartType.Text,
        text: parts[i - 1].text + '<br>' + parts[i].text
      };
      parts.splice(i - 1, 2, part);
    }
  }
}

export function isValidEmbeddedPart(part: TemplatePartModel) {
  return part && part.linkTypeId && part.perspective;
}
