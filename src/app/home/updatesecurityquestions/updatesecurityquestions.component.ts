import { Component, OnInit } from '@angular/core';
import { ListingService } from 'src/app/core/services/listing/listing.service';
import { CommonService } from '../../core/services/common/common.service';
import { Router } from '@angular/router';
import { concatMap, map } from 'rxjs/operators';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
@Component({
  selector: 'app-updatesecurityquestions',
  templateUrl: './updatesecurityquestions.component.html',
  styleUrls: ['./updatesecurityquestions.component.scss']
})
export class UpdatesecurityquestionsComponent implements OnInit {
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
  showmsg = 0

  constructor(
    public router: Router,
    public ls: ListingService,
    public cs: CommonService,
    private trackingService: UserTrackingService
  ) {
    if (this.cs.security_dashredirect == 0) {

      this.cs.emitChange('1');
    }
  }


  openforgotpwd(id) {
    this.cs.postData({ sourceid: 'auth/forgotpwd', info: { uname: id } })
      .subscribe(data => {
        //  alert(JSON.stringify(data));
        if (data['status'] == 1) {
          try {
            this.forgotpassword_validation = "";
            this.forgotpassword_data = [['', ''], ['', '']];
            this.forgotpassword_data = JSON.parse(data['response'][0]['security_questions']);
            if (this.forgotpassword_data[0][0] == '' || this.forgotpassword_data[1][0] == '') {
              this.showmsg = 1;
            }
          } catch (err) {
            //alert("There is a problem in retreving your securty questions");
          }
        } else {
          //this.formvalidation="Incorrect Username or password"
        }
      }, error => console.log(error));
  }
  updateSecQuestions(formvalid) {
    if (formvalid.valid) {
      this.cs.postData({ sourceid: 'auth/updateseqques', info: { security_questions: JSON.stringify(this.forgotpassword_data), id: this.cs.user_session.id } })
        .pipe(
          map(data => {
            //alert(JSON.stringify(data));
            if (data['status'] == 1) {
              this.showmsg = 1;
              this.qasshow = false;
              setTimeout(() => {
                this.qasshow = true;
              }, 100);
              this.forgotpassword_validation = "";
              this.cs.openGrowl('', 'Status', 'Security Questions & Answers updated  successfully');
              if (this.cs.security_dashredirect == 1) {
                this.cs.security_dashredirect = 0;
                this.router.navigate(['/home/dashboard']);
              }
            } else {
              this.forgotpassword_validation = "Some error occured please try again";
            }
          }),
          concatMap(_ => {
            return this.trackingService.trackSQueChange({
              uid: this.cs.user_session.id,
              type: TrackingTypes.TYPE_SECURITY_QUE_CHANGE
            });
          })
        )
        .subscribe(
          _ => { },
          err => {
            console.error(err);
          });
    } else {
      this.forgotpassword_validation = "Fill out all fields";
    }
  }
  ngOnInit() {

    if (this.cs.user_session.user_type == 0) {
      this.cs.page_header = "Admin Security Questions";
    } else {
      this.cs.page_header = "Security Questions";
    }

    this.openforgotpwd(this.cs.user_session.user_name);
  }

}
