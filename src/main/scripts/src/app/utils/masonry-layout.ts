/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License";
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
 * Manages masonry layout https://masonry.desandro.com of elements
 * Methods have to be wrapped inside `window.setImmediate()` from the caller to work
 */
export class MasonryLayout {

  private layout: any;

  constructor(parameters: object) {
    this.layout = $('.grid')['masonry'](parameters);
  }

  /**
   * https://masonry.desandro.com/methods.html#layout-masonry
   */
  public refresh(): void {
    this.layout.masonry();
  }

  /**
   * https://masonry.desandro.com/methods.html#appended
   */
  public append(element: any): void {
    this.layout
      .append(element)
      .masonry('appended', element);
  }

  /**
   * https://masonry.desandro.com/methods.html#prepended
   */
  public prepend(element: any): void {
    this.layout
      .prepend(element)
      .masonry('prepended', element);
  }

  /**
   * https://masonry.desandro.com/methods.html#remove
   */
  public remove(element: any): void {
    this.layout
      .masonry('remove', element)
      .masonry();
  }

  /**
   * https://masonry.desandro.com/methods.html#stamp
   */
  public stamp(element: any): void {
    this.layout
      .masonry('stamp', element)
      .masonry();
  }

  /**
   * https://masonry.desandro.com/methods.html#unstamp
   */
  public unstamp(element: any): void {
    this.layout
      .masonry('unstamp', element)
      .masonry();
  }

  /**
   * https://masonry.desandro.com/methods.html#layoutitems
   */
  public layoutItems(elements: any[], animated: boolean): void {
    this.layout.masonry('layoutItems', elements, animated);
  }

  /**
   * https://masonry.desandro.com/methods.html#addItems
   */
  public addItems(elements: any[]): void {
    this.layout.masonry('addItems', elements);
  }

  /**
   * https://masonry.desandro.com/methods.html#reloadItems
   */
  public reload(): void {
    this.layout.masonry('reloadItems');
  }

  /**
   * https://masonry.desandro.com/methods.html#destroy
   */
  public destroy(): void {
    this.layout.masonry('destroy');
  }

}
