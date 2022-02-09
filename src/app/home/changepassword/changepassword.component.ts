import { Component, OnInit } from '@angular/core';
import { ListingService } from '../../core/services/listing/listing.service';
import { CommonService } from '../../core/services/common/common.service';
import { Router } from '@angular/router';
import { Md5Service } from 'src/app/core/services/md5/md5.service';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { concatMap, map } from 'rxjs/operators';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { of } from 'rxjs';
@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css']
})
export class ChangepasswordComponent implements OnInit {
  showpassword1 = 0;
  showpassword2 = 0;
  formvalidation: string;
  showListing = true;
  retype_pwd = "";
  oldPassword = "";
  resetpop = 0;
  resetpwds = { newpwd: '', retypepwd: "", oldpassword: "" };
  resetpwd_validation = "";
  forgotpassword_validation = "";
  forgotpassword_data = [['', ''], ['', '']];
  forgotpwd_answers = ['', ''];
  qasshow = true;

  constructor(
    public ls: ListingService,
    public router: Router,
    public cs: CommonService,
    private md5Service: Md5Service,
    private trackingService: UserTrackingService
  ) {
    this.cs.emitChange('1');
  }

  updatepwd(changeForm) {
    if (changeForm.valid) {
      this.resetpwd_validation = "";
      // alert(JSON.stringify(this.cs.user_session));
      if (this.resetpwds.oldpassword == this.resetpwds.newpwd) {
        this.resetpwd_validation = "New password cannot be old password.";
        return;
      }
      if (this.resetpwds.newpwd == this.resetpwds.retypepwd) {
        this.cs.postData({ sourceid: 'auth/resetpwd', info: { oldpassword: this.md5Service.getMd5(this.resetpwds.oldpassword), resetpwd: this.md5Service.getMd5(this.resetpwds.newpwd), id: this.cs.user_session.id } })
          .pipe(
            map(data => {
              //alert(JSON.stringify(data));
              if (data['status'] == 1) {
                changeForm.resetForm();
                this.resetpwds = { newpwd: '', retypepwd: "", oldpassword: '' };
                this.resetpwd_validation = "";
                this.cs.openGrowl('', 'Status', 'Password Updated Sucessfully');
              }
              else if (data['status'] == 3) {
                //this.modalService.dismissAll();
                this.resetpwd_validation = "Invalid Old Password";
              } else {
                this.resetpwd_validation = "Some Error occured";
              }
            }),
            concatMap(_ => {
              // don't update user activity for invalid data
              if (this.resetpwd_validation.length > 0) return of(_);

              return this.trackingService.trackPasswordChange({
                uid: this.cs.user_session.id,
                type: TrackingTypes.TYPE_PWD_CHANGE
              })
            })
          ).subscribe(
            _ => { },
            err => {
              console.error(err);
            });
      } else {
        this.resetpwd_validation = "New and Re-enter Passwords don't match";
      }
    } else {
      this.resetpwd_validation = 'Fill out all Mandatory Fields';
    }
  }
  ngOnInit() {
    this.cs.page_header = "Change Password";
  }
}
