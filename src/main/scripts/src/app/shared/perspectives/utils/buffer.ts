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

/**
 * Provides buffering by calling update function after a specified time passes without any changes made.
 */
export class Buffer {

  private timerId: number;

  private bufferingTime: number;

  private buffering: boolean;

  private onFinish: () => void;

  constructor(finishFunction: () => void, timeout: number) {
    this.bufferingTime = timeout;

    this.onFinish = () => {
      this.buffering = false;
      finishFunction();
    };

    this.stageChanges();
  }

  public stageChanges(): void {
    this.buffering = true;
    window.clearTimeout(this.timerId);
    this.timerId = window.setTimeout(this.onFinish, this.bufferingTime);
  }

  public flush(): void {
    if (this.buffering) {
      window.clearTimeout(this.timerId);
      this.onFinish();
    }
  }

}
