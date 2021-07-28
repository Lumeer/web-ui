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

import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {EMPTY, Observable, of} from 'rxjs';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {PercentageConstraint} from '@lumeer/data-filters';

@Injectable({
  providedIn: 'root',
})
export class UserHintService {
  public constructor(private store$: Store<AppState>) {}

  public processDataHints(values: any[], entry: [string, any], collection: Collection): Observable<any> {
    if (values.length === 3) {
      if (this.checkPercentageValues(values)) {
        const attribute = collection.attributes.filter(attr => attr.id === entry[0])[0];
        return of(this.getPercentageHint(collection, attribute));
      }
    }

    return EMPTY;
  }

  private checkPercentageValues(values: any[]): boolean {
    const filteredCount = this.filterPercentageValues(values).length;
    return filteredCount === values.length;
  }

  private getPercentageHint(collection: Collection, attribute: Attribute): NotificationsAction.Hint {
    const message = $localize`:@@lumeer.advice.percentage:I suggest to set the column type of ${attribute.name}:attributeName: to percentage. Do you agree?`;
    const yesButtonText = $localize`:@@button.yes:Yes`;
    const noButtonText = $localize`:@@button.no:No`;

    return new NotificationsAction.Hint({
      message,
      buttons: [
        {
          text: yesButtonText,
          bold: true,
          action: () => {
            this.store$.dispatch(
              new CollectionsAction.ChangeAttribute({
                collectionId: collection.id,
                attributeId: attribute.id,
                attribute: {...attribute, constraint: new PercentageConstraint({})},
              })
            );
          },
        },
        {
          text: noButtonText,
        },
      ],
    });
  }

  private filterPercentageValues(values: any[]): any[] {
    return values.filter(val => {
      if (!!val) {
        const strVal = String(val);

        if (strVal.endsWith('%')) {
          const numPart = strVal.substring(0, strVal.length - 1);
          if (!isNaN(+numPart)) {
            return true;
          }
        }
      }

      return false;
    });
  }
}
