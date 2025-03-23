import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GlobalEvents } from '../utils/global-events';

@Injectable({
  providedIn: 'root'
})
export class GlobalEventService {
  private eventSubject = new Subject<{ name: string; data?: any }>();

  // Observable to subscribe to
  public events$ = this.eventSubject.asObservable();

  // Emit an event
  emitEvent(name: GlobalEvents, data?: any) {
    this.eventSubject.next({ name, data });
  }
}
