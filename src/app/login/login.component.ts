import { Component, OnInit, ApplicationRef } from '@angular/core';
import { CommonService } from '../core/services/common/common.service';
import { Router } from '@angular/router';
import { IetmModalService } from '../core/services/ietm-modal/ietm-modal.service';
import { Md5Service } from '../core/services/md5/md5.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public login = { uname: '', upwd: '', machine_id: '' };
  formvalidation = "";
  showpassword = 0;
  formvalidation_status = 1;
  forgotpassword_validation = "";
  forgotpassword_data = [['', ''], ['', '']];
  forgotpwd_answers = ['', ''];
  resetpop = 0;
  resetpwds = { newpwd: '', retypepwd: "" };
  resetpwd_validation = "";
  seluserid = 0;
  public logdata = { version_no: 0, log_date: new Date() };
  public serverdata = { ip: '' };
  public setupvalidation = "";

  constructor(
    public mdls: IetmModalService,
    public router: Router,
    public cs: CommonService,
    public appref: ApplicationRef,
    private md5Service: Md5Service
  ) {
    /*mdlconfig.backdrop = 'static';
    mdlconfig.keyboard = false;*/
    this.cs.emitChange('0');
  }
  ngOnInit() {
    this.initMachineID();
  }

  initMachineID() {
   this.cs.getMachineId()
   .then(v => this.login.machine_id = v) 
  }

  loginuser() {
    this.formvalidation = '';
    //logindata.upwd = md5(logindata.upwd);
    var tempwd = this.md5Service.getMd5(this.login.upwd);
    this.cs.postData<any>({
      sourceid: 'auth/login', info: {
        ...this.login,
        upwd: tempwd
      }
    })
      .subscribe(data => {
        const { status, response } = data;
        // console.log(JSON.stringify(data));
        this.formvalidation_status = status;
        this.appref.tick();
        if (status == 1) {
          const { token, updateSecurityQuestions } = response;
          this.cs.setusersession(token);
          //   alert(JSON.stringify(seq));
          if (updateSecurityQuestions) {
            this.cs.security_dashredirect = 1;
            this.router.navigate(['/home/updatesecurityquestions']);
          }
          else {
            this.router.navigate(['/home/dashboard']);
          }
        } else if (status == 2) {
          this.formvalidation = "Invalid Credentials";
          /*  } else if (data['status'] == 3) {
              this.formvalidation = "UserID Disabled";
            } else if (data['status'] == 4) {
              this.formvalidation = "Invalid Password";*/
        } else {
          this.formvalidation = "Some Error occured";
        }
      }, error => console.log(error));
  }
  openforgotpwd(id) {
    this.cs.postData({ sourceid: 'auth/forgotpwd', info: { uname: this.login.uname } })
      .subscribe(data => {
        //  console.log(JSON.stringify(data));
        if (data['status'] == 1) {
          if (data['response'].length > 0) {
            this.formvalidation = "";
            this.forgotpassword_validation = "";
            this.forgotpassword_data = [['', ''], ['', '']];
            this.forgotpwd_answers = ['', ''];
            this.forgotpassword_data = JSON.parse(data['response'][0]['security_questions']);
            this.seluserid = data['response'][0]['id'];
            this.resetpop = 0;
            this.mdls.openmdl(id);
          } else {
            this.formvalidation = "UserName is not Registered";
          }

        } else {

        }
      }, error => console.log(error));
  }
  updatepwd() {
    if (this.resetpwds.newpwd == this.resetpwds.retypepwd) {
      this.cs.postData({ sourceid: 'auth/resetpwd', info: { id: this.seluserid, resetpwd: this.md5Service.getMd5(this.resetpwds.newpwd) } })
        .subscribe(data => {
          // alert(JSON.stringify(data));
          if (data['status'] == 1) {
            // this.mdls.dismiss();
            //
            this.resetpwds = { newpwd: '', retypepwd: "" };
            this.resetpwd_validation = "";
            this.cs.openGrowl('', 'Status', 'Updated Password Successfully"');
            this.mdls.closepop();
          } else {
            this.resetpwd_validation = "Some Error occured";
          }
        })
    } else {
      this.resetpwd_validation = "New Password and Re-entered Password don’t match";
    }
  }
  validate_forgotpwform() {
    if (this.forgotpwd_answers[0].toString().toLowerCase() == this.forgotpassword_data[0][1].toString().toLowerCase() &&
      this.forgotpwd_answers[1].toString().toLowerCase() == this.forgotpassword_data[1][1].toString().toLowerCase()) {
      this.resetpop = 1;
    } else {
      this.forgotpassword_validation = "Invalid Answers";
    }
  }
}


