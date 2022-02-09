import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { HyperlinkActionTypes } from '../../models/hyperlink-data';
import { HyperlinkService } from '../../services/hyperlink/hyperlink.service';

@Component({
  selector: 'app-hyperlink-delete',
  templateUrl: './hyperlink-delete.component.html',
  styleUrls: ['./hyperlink-delete.component.scss']
})
export class HyperlinkDeleteComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService,
    private mdls: IetmModalService,
    private hS: HyperlinkService
  ) { }

  hypId = -1;
  pgdesc: string = '';

  modalRef: BsModalRef = null;

  delHypSub$: Subscription = null;
  delHypHTMLSub$: Subscription = null;

  ngOnInit(): void {
  }

  closeModal() {
    this.mdls.closepop();
  }

  hypDel() {
    // process request
     this.delHypSub$ = this.cs.postData({ sourceid: 'list_rowdel', info: { query: 'hyperlinks', column: 'id', selids: [this.hypId] } })
      .subscribe(data => {
        this.hS.triggerHyp$.next({
          action: HyperlinkActionTypes.TYPE_POST_DEL,
          status: data['status'],
          data: {
            node_id: this.hypId
          }
        });
      })
  }

  ngOnDestroy() {
    this.closeModal();
    this.delHypSub$?.unsubscribe();
    this.delHypHTMLSub$?.unsubscribe();
  }

}
