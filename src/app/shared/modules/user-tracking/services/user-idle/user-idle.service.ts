import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * User's idle service.
 */
@Injectable({
  providedIn: 'root'
})
export class UserIdleService {

  private IDLE_TIMEOUT = 60 * 5; //seconds
  private _idleSecondsCounter = 0; // internal counter

  private myInterval = null;

  private _event$ = new Subject();

  // add trackable events here
  private eventsArray = ['click', 'mousemove', 'keypress'];

  get onTimeout() {
    return this._event$;
  }

  startWatching() {
    this.eventsArray.forEach(e => {
      document.addEventListener(e, () => this.resetCounter());
    });

    // use bind to set `this` to Angular service's `this` and not setInterval's `this`
    this.myInterval = window.setInterval(this.checkIdleTime.bind(this), 1000);
  }



private checkIdleTime() {
  // Increment counter
  this._idleSecondsCounter+=1;
  // Check if session expired
  if (this._idleSecondsCounter >= this.IDLE_TIMEOUT) {
      this.resetCounter();
      this.onTimeout.next();
  }
}

private resetCounter() {
  this._idleSecondsCounter = 0;
}

stopWatching() {
  window.clearInterval(this.myInterval);
  this.eventsArray.forEach(e => {
    document.removeEventListener(e, () => this.resetCounter());
  });
}

}