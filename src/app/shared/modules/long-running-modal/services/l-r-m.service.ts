import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LRMService {

  constructor() { }

  trigger$ = new Subject();

  private isVisible = false;

  message = 'Task In Progress...';

  isModalVisible() {
    return this.isVisible;
  }

  updateMessage(str: string) {
    this.message = str;
  }

  showBackdrop() {
    this.trigger$.next(true);
    this.isVisible = true;
  }

  hideBackdrop() {
    this.trigger$.next(false);
    // reset UI
    this.isVisible = false;
    this.message = 'Task In Progress...';
  }
}
