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

import {Buffer} from './buffer';

/**
 * Provides Pinterest-like layout using minigrid library http://minigrid.js.org/
 */
export class PostItLayout {

  private resizeListener;

  constructor(private parameters: object) {
    const windowResizeRefreshBuffer = new Buffer(() => this.refresh(), 300);
    this.resizeListener = () => windowResizeRefreshBuffer.stageChanges();

    window.addEventListener('resize', this.resizeListener);
  }

  public refresh(): void {
    new window['Minigrid'](this.parameters).mount();
  }

  public destroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

}
