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
import {LUMEER_BLOCKLY_MESSAGES_CS, LUMEER_BLOCKLY_MESSAGES_EN} from './lumeer-messages';

export const BLOCKLY_MEDIA_PATH = 'assets/blockly/media/';

let blockly: Promise<any>;

/**
 * Options of the Blockly workspace in the editor.
 */
export function blocklyOptions(toolbox: string): Record<string, any> {
  return {
    toolbox,
    media: BLOCKLY_MEDIA_PATH,
    sounds: false,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
      pinch: true,
    },
  };
}

/**
 * Lazily loads Blockly with all Lumeer customizations and publishes it as window.Blockly.
 */
export function loadBlockly(locale: string): Promise<any> {
  if (blockly === undefined) {
    blockly = createBlockly(locale);
  }
  return blockly;
}

async function createBlockly(locale: string): Promise<any> {
  const czech = locale === 'cs';
  const [Blockly, {javascriptGenerator}, messages, {FieldFA}, {installColourBlocks}] = await Promise.all([
    import('blockly'),
    import('blockly/javascript'),
    czech ? import('blockly/msg/cs') : import('blockly/msg/en'),
    import('./field-fa'),
    import('./colour'),
  ]);

  Blockly.setLocale({
    ...(messages as any),
    ...(czech ? LUMEER_BLOCKLY_MESSAGES_CS : LUMEER_BLOCKLY_MESSAGES_EN),
  });
  Blockly.utils.colour.setHsvValue(0.85);

  installColourBlocks(javascriptGenerator);
  Blockly.fieldRegistry.register('field_fa', FieldFA);

  // Our blocks fill dropdown options (attributes, link types...) only after the block gets connected,
  // so a saved value must survive loading even when it is not among the options yet.
  class LenientFieldDropdown extends Blockly.FieldDropdown {
    protected doClassValidation_(newValue?: any): any {
      return newValue === null || newValue === undefined ? null : String(newValue);
    }

    protected doValueUpdate_(newValue: string) {
      super.doValueUpdate_(newValue);
      if (!this.getOptions(true).some(option => option[1] === newValue)) {
        (this as any).selectedOption = [newValue, newValue];
      }
    }
  }
  Blockly.fieldRegistry.unregister('field_dropdown');
  Blockly.fieldRegistry.register('field_dropdown', LenientFieldDropdown);

  // the generator is published together with the core API, because block definitions may not import Blockly
  // statically (that would pull it to the main bundle)
  const api = {...Blockly, JavaScript: javascriptGenerator};
  (window as any).Blockly = api;
  return api;
}
