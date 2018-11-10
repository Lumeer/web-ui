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
