import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';

@Component({
  selector: 'app-search-del',
  templateUrl: './search-del.component.html',
  styleUrls: ['./search-del.component.scss']
})
export class SearchDelComponent implements OnInit {

  triggerDel$ = new Subject();
  searchInfo = null;
  modalRef: BsModalRef = null;

  constructor(
    public cs: CommonService
  ) { }

  ngOnInit(): void {
  }

  deleteSearchItem() {
    this.cs.postData({ sourceid: 'delete_listing', info: { query: 'gs_keywords', pdata: { id: 'id', value: this.searchInfo.id } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          this.triggerDel$.next(data.status);
        } else {
          this.cs.openGrowl('', 'Status', 'Error occured');
        }
      },
      err => {
        console.error(err);
        this.cs.openGrowl('', 'Status', 'Error occured');
      });

  }

}
