import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { LRMService } from '../../services/l-r-m.service';

@Component({
  selector: 'app-l-r-modal',
  templateUrl: './l-r-modal.component.html',
  styleUrls: ['./l-r-modal.component.scss']
})
export class LRModalComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('lrmBackdrop', { static: false }) public backdrop: ModalDirective;
  triggerSub$: Subscription = null
  triggerDrag$: Subscription = null

  constructor(
    public lrmS: LRMService,
    private mdls: IetmModalService
  ) { }


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.triggerSub$ = this.lrmS.trigger$.subscribe(data => {
      if (data) {
        if (this.backdrop)
          this.backdrop.show();
      } else {
        if (this.backdrop)
          this.backdrop.hide();
      }
      if (!this.backdrop) {
        console.warn('Unable to init backdrop for LRMComponent')
      }
      if (this.backdrop) {
        this.triggerDrag$ = this.backdrop.onShow.subscribe(_ => {
          this.mdls.popdragabale();
        })
      }
    });
  }

  ngOnDestroy() {
    if (this.triggerSub$)
      this.triggerSub$.unsubscribe();

    if (this.triggerDrag$)
      this.triggerDrag$.unsubscribe();
  }

}
