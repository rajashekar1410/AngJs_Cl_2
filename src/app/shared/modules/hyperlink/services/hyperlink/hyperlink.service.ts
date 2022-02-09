import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IHyperlinkTransmitData } from '../../models/hyperlink-data';

@Injectable({
  providedIn: 'root'
})
export class HyperlinkService {

  constructor() { }

  triggerHyp$ = new Subject<IHyperlinkTransmitData>();
}
