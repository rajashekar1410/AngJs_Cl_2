import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { IPageModule } from 'src/app/core/models/page-module';

@Component({
  selector: 'app-module-access-rights',
  templateUrl: './module-access-rights.component.html',
  styleUrls: ['./module-access-rights.component.scss']
})
export class ModuleAccessRightsComponent implements OnInit {

  constructor(
    public mdls: IetmModalService,
    public cs: CommonService
  ) { }

  userRoles = [];

  moduleInfo: IPageModule = {
    id: -1, // assigned on modal init
    name: '',
    image: '',
    descr: '',
    maintainer_rights: 1,
    operator_rights: 1
  }

  tdata = {};

  ngOnInit() {
    this.getData();
  }

  getData() {
    setTimeout(() => {
      this.cs.postData({
        sourceid: 'listingdetails', info: { query: 'page_modules', pdata: { id: 'id', value: this.moduleInfo.id }, selcolumns: Object.keys(this.moduleInfo) }
      })
        .subscribe(
          (data: any) => {
            if (data.status == 1) {
              this.moduleInfo = data.response;
            }
          },
          err => {
            console.error(err);
          }
        )

    }, 500);
  }

  updateRights(event, key: string) {
    const isChecked = event.target.checked ? 1 : 0;
    this.tdata[key] = isChecked;
  }

  saveChanges() {
    const isModified = Object.keys(this.tdata).length != 0;
    if(!isModified) {
      this.cs.openGrowl('', 'Status', 'Access rights updated successfully.');
      this.mdls.closepop();
      return;
    }
    this.cs.postData({ sourceid: 'listmgr', info: { tdata: this.tdata, query: 'page_modules', pdata: { id: 'id', value: this.moduleInfo.id } } })
    .subscribe(
        data => {
          if(data['status'] == 1) {
            this.cs.openGrowl('', 'Status', 'Access rights updated successfully.');
            this.mdls.closepop();
          }
        },
        error => {
          console.error(error);
        });
  }

}
