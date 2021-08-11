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

/**
 * The ResizeObserver interface is used to observe changes to Element's content
 * rect.
 *
 * It is modeled after MutationObserver and IntersectionObserver.
 */
export interface ResizeObserver {
  new (callback: ResizeObserverCallback);

  /**
   * Adds target to the list of observed elements.
   */
  observe: (target: Element) => void;

  /**
   * Removes target from the list of observed elements.
   */
  unobserve: (target: Element) => void;

  /**
   * Clears both the observationTargets and activeTargets lists.
   */
  disconnect: () => void;
}

/**
 * This callback delivers ResizeObserver's notifications. It is invoked by a
 * broadcast active observations algorithm.
 */
export interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver);
}

export interface ResizeObserverEntry {
  /**
   * @param target The Element whose size has changed.
   */
  new (target: Element);

  /**
   * The Element whose size has changed.
   */
  readonly target: Element;

  /**
   * Element's content rect when ResizeObserverCallback is invoked.
   */
  readonly contentRect: DOMRectReadOnly;
}
