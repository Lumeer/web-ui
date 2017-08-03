import {Observable} from 'rxjs/Observable';
import * as io from 'socket.io-client';
import {Injectable} from '@angular/core';
import {Observer} from 'rxjs';

/**
 * Injectable websocket io.
 * Usage:
 * ```
 *  let socket = new Socket();
 *  socket.messages.subscribe(message => {
 *     // do something with message
 *  })
 * ```
 */
@Injectable()
export class SocketService {
  public socket: any = null;
  public messages: Observable<any>;
  private _messagesObserver : Observer<string>;

  constructor() {
    this.socket = io('ws://localhost:8080/lumeer-engine/push/chat');
    this.messages = new Observable(observer => this._messagesObserver = observer);
    this.socket.on('message', (data) => {
      this._messagesObserver.next(data);
    });
  }

  public sendMessage(message) {
    this.socket.emit('add-message', message);
  }
}
