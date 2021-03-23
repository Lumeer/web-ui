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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Sequence} from '../../../core/model/sequence';
import {NotificationService} from '../../../core/notifications/notification.service';

@Component({
  selector: '[sequence-item]',
  templateUrl: './sequence-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SequenceItemComponent {
  @Input()
  public sequence: Sequence;

  @Output()
  public removeSequence = new EventEmitter<Sequence>();

  @Output()
  public updateSequence = new EventEmitter<Sequence>();

  constructor(private notificationService: NotificationService) {}

  public remove(): void {
    const message = $localize`:@@sequence.item.delete.message:Do you want to permanently remove this sequence?`;
    const title = $localize`:@@sequence.item.delete.title:Remove sequence?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.removeSequence.emit(this.sequence));
  }

  private update(seq: number): void {
    this.updateSequence.emit({...this.sequence, seq});
  }

  public updateValue(event: Event) {
    if (event.target) {
      event.stopImmediatePropagation();

      const element = event.target as HTMLInputElement;
      if (element.value && +element.value !== this.sequence.seq) {
        this.update(+element.value);
      }
    }
  }
}
