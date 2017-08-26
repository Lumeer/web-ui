/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

export class Popup {

  public static confirmDanger(title: string, message: string, noLabel: string, onNo: () => void, yesLabel: string, onYes: () => void): void {
    window['BootstrapDialog'].show({
      type: 'type-danger',
      title: `${title}?`,
      message: message,
      buttons:
        [
          {
            label: `No, ${noLabel}`,
            action: dialog => {
              dialog.close();
              onNo();
            }
          },
          {
            label: `Yes, ${yesLabel}`,
            cssClass: 'btn-danger',
            hotkey: 13, // Enter
            action: dialog => {
              dialog.close();
              onYes();
            }
          }
        ]
    });
  }

}
