import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { HyperlinkActionTypes, IHyperlinkItem } from '../../models/hyperlink-data';
import { HyperlinkService } from '../../services/hyperlink/hyperlink.service';

@Component({
  selector: 'app-hyperlink-preview',
  templateUrl: './hyperlink-preview.component.html',
  styleUrls: ['./hyperlink-preview.component.scss']
})
export class HyperlinkPreviewComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService,
    private hS: HyperlinkService
  ) { }

  myTitle = 'Hyperlink Options';
  myData: IHyperlinkItem = { id: '', content: '', from_page: -1, to_page: -1 };
  myValidation = '';

  fetchDataSub$: Subscription = null;

  modalRef: BsModalRef = null;

  actionTypes = HyperlinkActionTypes;
  actionType: HyperlinkActionTypes = null;

  ngOnInit(): void {
    this.fetchDataSub$ = this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'hyperlinks', pdata: { id: 'id', value: this.myData.id }, selcolumns: Object.keys(this.myData) }
    })
      .subscribe((data: any) => {
        if (data.status == 1) {
          if(data?.response) {
            this.myData = data.response;
          }
          this.cs.popdragabale();
        }
      }, err => alert(err))
  }

  processRequest(action: HyperlinkActionTypes) {
    if (action == HyperlinkActionTypes.TYPE_VIEW) {
      this.cs.navigateToPage(this.myData.to_page);
    } else if([HyperlinkActionTypes.TYPE_DELETE, HyperlinkActionTypes.TYPE_EDIT].includes(action)) {
      // process request
      this.hS.triggerHyp$.next({
        action,
        data: {
          node_id: parseInt(this.myData.id)
        }
      });
    }
    // In the end, hide modal
    this.closeModal();
  }

  closeModal() {
    this.modalRef?.hide();
  }

  ngOnDestroy() {
    this.fetchDataSub$?.unsubscribe();
    this.closeModal();
  }

}
