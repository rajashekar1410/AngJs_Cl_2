import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { HyperlinkActionTypes, IHyperlinkItem } from '../../models/hyperlink-data';
import { HyperlinkService } from '../../services/hyperlink/hyperlink.service';

@Component({
  selector: 'app-hyperlink-add-upd',
  templateUrl: './hyperlink-add-upd.component.html',
  styleUrls: ['./hyperlink-add-upd.component.scss']
})
export class HyperlinkAddUpdComponent implements OnInit, OnDestroy {

  constructor(
    private cs: CommonService,
    private hS: HyperlinkService
  ) { }

  myTitle = '';
  buttonText = '';
  myValidation = '';

  myData: IHyperlinkItem = { id: '', content: '', from_page: -1, to_page: -1 };
  editMode = false;

  modalRef: BsModalRef = null;

  addUpdSub$: Subscription = null;
  fetchDataSub$: Subscription = null;

  ngOnInit(): void {
    // Set UI on first init
    this.updateMode(this.editMode);
  }

  loadHyperlinkContents() {
    this.fetchDataSub$ = this.cs.postData({
      sourceid: 'listingdetails', info: { query: 'hyperlinks', pdata: { id: 'id', value: this.myData.id }, selcolumns: Object.keys(this.myData) }
    })
      .subscribe(
        (data: any) => {
          const {status, response} = data;
          if (status == 1) {
            if (response) {
              this.myData = response;
            } else {
              this.cs.openGrowl('','Status', 'Hyperlink data unavailable');
              this.modalRef?.hide();
            }
          }
        },
        err => {
          console.error(err);
        })
  }

  updateMode(edit: boolean) {
    this.editMode = edit
    if (!this.editMode) {
      this.myTitle = 'Add Hyperlink'
      this.buttonText = 'SAVE'
    } else {
      this.myTitle = 'Edit Hyperlink'
      this.buttonText = 'UPDATE'
      this.loadHyperlinkContents();
    }
  }

  processRequest(pageform: NgForm) {
    if (pageform.valid) {
      const page_no = pageform.controls.page_no.value
      if (page_no >= 0) {
        // update server #1
        this.addUpdSub$ = this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.myData, query: 'hyperlinks', pdata: { id: 'id', value: this.myData.id } } })
          .subscribe((resp: any) => {
            if (resp.status == 1) {
              // hide modal
              this.modalRef.hide();
              // inform subscriber
              const action = this.editMode ? HyperlinkActionTypes.TYPE_POST_EDIT : HyperlinkActionTypes.TYPE_POST_ADD;
              this.hS.triggerHyp$.next({
                status: resp.status,
                action,
                data: {
                  to_page: this.myData.to_page,
                  mode: this.editMode,
                  node_id: resp.response
                }
              });
            }
          })
      } else {
        this.myValidation = 'Invalid page no entered'
      }
    }
  }
  resetFields() {
    this.myData = { id: '', content: '', from_page: -1, to_page: -1 };
    this.myValidation = '';
    this.buttonText = '';
    this.myTitle = '';
  }

  ngOnDestroy() {
    this.resetFields();
    this.addUpdSub$?.unsubscribe();
    this.modalRef?.hide();
    this.fetchDataSub$?.unsubscribe();
  }

}
