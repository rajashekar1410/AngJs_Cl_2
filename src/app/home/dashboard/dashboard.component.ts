import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LogoutModalComponent } from '../logout-modal/logout-modal.component';
import { ISContentTypes } from 'src/app/shared/modules/intelligent-search/models/intelligent-search';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public access_rights = [false, false, false, false];
  contentTypes = ISContentTypes;

  constructor(
    public router: Router,
    public mdls: IetmModalService,
    public cs: CommonService,
    private modalS: BsModalService
  ) {
    this.cs.emitChange('0');
  }

  public openlogout() {
    this.modalS.show(LogoutModalComponent, { ignoreBackdropClick: true, keyboard: false, class: this.cs.default_theme });
  }
  /*skipmodule(){
   // console.log("=====userid===="+this.cs.user_session.user_type);
    if(this.cs.user_session.user_type==2){
      if(this.cs.user_session.access_rights !=''){
        this.access_rights=JSON.parse(this.cs.user_session.access_rights);
        for(var i in this.access_rights){
         // console.log(this.access_rights[i]+"//////");
         if(this.access_rights[i]==true){
           //   console.log("======access rights matched in if=============");
           this.cs.default_category=this.cs.page_categories[i]['id'];
           //  console.log("===final category==="+ this.cs.default_category);
           this.router.navigate(['/home/pages/pagecmp/'+this.cs.default_category ]);
           break;
         }
       }
      }
    }else{
      this.cs.default_category =1;
      this.router.navigate(['/home/pages/pagecmp/'+this.cs.default_category ]);
    }
  }*/
  logout() {
    this.cs.userLogout();
  }
  public opendetails(data) {
    this.cs.seluserdata = data;
    this.cs.page_header = "View Activity";
    this.router.navigate(['/home/userhistory', data.id]);
  }

  getUserRole() {
    try {
      return this.cs.user_types.find(e => e['user_type_id'] == this.cs.user_session.user_type)['user_type'];
    } catch (err) {
      return '--'
    }
  }


  isMenuItemAccessible(contentType: ISContentTypes) {
    const userType = this.cs.user_session.user_type;
    if (userType == 0) {
      // superadmin acc, access is always granted.
      return true;
    }
    try {
      // check access
      let pc = null;
      switch (contentType) {
        case ISContentTypes.TYPE_IETM:
          pc = this.cs.page_categories.find(e => e['id'] == 1);
          break;
        case ISContentTypes.TYPE_MANUALS:
          pc = this.cs.page_categories.find(e => e['id'] == 2);
          break;
        case ISContentTypes.TYPE_DRAWINGS:
          pc = this.cs.page_categories.find(e => e['id'] == 3);
          break;
        case ISContentTypes.TYPE_INVENTORY:
          pc = this.cs.page_categories.find(e => e['id'] == 6);
          break;
      }
      if (userType == 1) {
        return parseInt(pc['admin_rights']) == 1
      } else if (userType == 2) {
        return parseInt(pc['operator_rights']) == 1
      } else if (userType == 3) {
        return parseInt(pc['maintainer_rights']) == 1
      } else {
        // default allow others, future compatibility with other user types.
        return true;
      }
    } catch (err) {
      return false;
    }
  }


  ngOnInit() {
    this.cs.page_header = "";

    //this.cs.postData({ sourceid: 'data_backup', info: { dmtype:0} })
    // .subscribe(data => {
    // alert(JSON.stringify(data));
    //if (data['status'] == 1) {

    // } else {
    //this.resetpwd_validation ="Some Error occured";
    // }
    //})
  }

}
