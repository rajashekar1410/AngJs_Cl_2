import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { CommonService } from '../../core/services/common/common.service';
import { IetmModalService } from '../../core/services/ietm-modal/ietm-modal.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Md5Service } from 'src/app/core/services/md5/md5.service';
import { PrintDataService } from 'src/app/shared/modules/print-data/services/print-data.service';
import { PrintDataTypes } from 'src/app/shared/modules/print-data/models/print-data-type';
import { UserTrackingService } from 'src/app/shared/modules/user-tracking/services/user-tracking/user-tracking.service';
import { ITrackUserEvent, TrackUserEvent } from 'src/app/shared/modules/user-tracking/models/track-user';
import { TrackingTypes } from 'src/app/shared/modules/user-tracking/models/tracking-data';
import { concatMap, map } from 'rxjs/operators';
import * as moment from 'moment';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  dtOptions: DataTables.Settings = {};
  admindtOptions: DataTables.Settings = {};
  @ViewChild('handoveradmin') public handoveradmin: ModalDirective;

  @ViewChild('addmember') addmember: ModalDirective
  @ViewChild('deletemember', { read: TemplateRef }) deletemember: TemplateRef<any>;
  @ViewChild('forgotpwdmdl', { read: TemplateRef }) forgotpwdmdl: TemplateRef<any>;
  @ViewChild('accessrights', { read: TemplateRef }) accessrights: TemplateRef<any>;

  public dtfilters = {};
  showpassword = 0;
  public tbl_start = 0;
  formvalidation: string;
  formdata = { tdata: { id: '', user_name: '', user_password: '', user_type: 2, employee_id: '' }, query: 'users', pdata: { id: 'id', value: '' } };
  lookuptypedata: any;
  showListing = true;
  form_title = 'Add User';
  form_btntitle = 'Submit';
  userlist = 0;
  userscount = 0;
  retype_pwd = "";
  present_password = "";
  userdeletion_object = {};
  public admin_userslist = [];
  public handovervalidation = "";
  public access_rights = [true, true, true, true];
  resetpwds = { newpwd: '', retypepwd: "" };
  resetpwd_validation = "";

  constructor(
    private http: HttpClient,

    public router: Router,
    public mdls: IetmModalService,
    public cs: CommonService,
    private md5Service: Md5Service,
    private printDataService: PrintDataService,
    private trackingService: UserTrackingService
  ) {
    this.cs.emitChange('1');

  }
  dtTrigger = new Subject();
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  setformvalues() {
    this.formvalidation = '';
    this.formdata = { tdata: { id: '', user_name: '', user_password: '', user_type: 2, employee_id: '' }, query: 'users', pdata: { id: 'id', value: '' } };
  }
  gotoLoginHistory(user) {
    this.router.navigateByUrl('/home/ul', {
      state: {
        user_id: user.id,
        user_name: user.user_name
      }
    });
  }
  ngOnDestroy() {
    this.cs.enable_sepcialprint = 0;
    this.dtTrigger.unsubscribe();
  }
  addform(mdlid) {
    this.form_title = 'Add User';
    this.form_btntitle = 'Submit';
    this.showListing = false;
    this.retype_pwd = "";
    this.present_password = "";
    this.formvalidation = "";
    this.setformvalues();
    this.mdls.openmdl(mdlid);
    this.cs.popdragabale();
  }
  delete_userconfirmation(mdlid, user) {
    this.formvalidation = "";
    this.userdeletion_object = user;
    this.mdls.openmdl(mdlid);
  }
  manageformsub(userfm) {
    this.formvalidation = "";
    if (userfm.valid) {
      this.cs.postData({
        sourceid: 'uniquefield_check',
        info: {
          query: 'users',
          cdata: { id: 'employee_id', value: this.formdata.tdata.employee_id },
          pdata: { id: 'id', value: this.formdata.tdata.id }
        },
      }).subscribe((data: any) => {
        if (data.status == 0) {
          let submitiondata = this.formdata;
          this.cs.postData({
            sourceid: 'uniquefield_check',
            info: {
              query: 'users',
              cdata: { id: 'user_name', value: this.formdata.tdata.user_name },
              pdata: { id: 'id', value: this.formdata.tdata.id }
            },
          }).subscribe((data: any) => {
            if (data.status == 0) {
              // fix: don't hash password on "Edit User" mode
              if (this.formdata.tdata.id == '') {
                submitiondata.tdata['user_password'] = this.md5Service.getMd5(submitiondata.tdata['user_password']);
                submitiondata.tdata['access_rights'] = JSON.stringify(this.access_rights);
              }
              const userEvent: ITrackUserEvent = {
                userName: submitiondata.tdata.user_name,
                employeeId: submitiondata.tdata.employee_id,
                // TODO: find better way to track event
                event: this.form_btntitle == 'Update' ? TrackUserEvent.TYPE_USER_EDITED : TrackUserEvent.TYPE_USER_ADDED
              }
              this.cs.postData({ sourceid: 'listmgr', info: submitiondata })
                .pipe(
                  concatMap(res => {
                    return this.trackingService.trackAnnotationEvent({
                      uid: this.cs.user_session.id,
                      type: TrackingTypes.TYPE_USER,
                      data: JSON.stringify(userEvent),
                    }).pipe(map(_ => res))
                  })
                )
                .subscribe((data: any) => {
                  if (data.status == 1) {
                    if (this.formdata.tdata.id! = '') {
                      this.cs.openGrowl('', 'Status', 'Updated Successfully');
                    } else {
                      this.cs.openGrowl('', 'Status', 'Updated Successfully');
                    }
                    $('#tbllistid').DataTable().ajax.reload();
                    this.mdls.closepop();
                    this.getdtllistings();
                  } else {
                    this.formvalidation = 'Some error Occurred';
                  }
                }, error => console.log(error))
            }
            else if (data.status == 1) {
              this.formvalidation = 'User Name already exists. Choose another User Name.';
            }
            else {
              this.formvalidation = 'Some error Occurred';
            }
          });
        } else if (data.status == 1) {
          this.formvalidation = 'User ID already exists. Choose another User ID.';
        }
        else {
          this.formvalidation = 'Some error Occurred';
        }
      }, error => console.log(error))
    }
    else {
      this.formvalidation = 'Fill out all Mandatory Fields';
    }

  }
  editform(mdlid, pvalue) {
    this.form_title = 'Edit User';
    this.form_btntitle = 'Update';
    this.formdata.pdata.value = pvalue;
    this.showListing = false;
    this.formvalidation = "";
    this.cs.postData({
      sourceid: 'listingdetails', info: {
        query: 'users',
        pdata: this.formdata.pdata, selcolumns: Object.keys(this.formdata.tdata)
      }
    })
      .subscribe((data: any) => {
        this.formdata.tdata = data.response;
        this.present_password = this.formdata.tdata.user_password;
        this.retype_pwd = this.formdata.tdata.user_password;
        this.mdls.openmdl(mdlid);
      }, error => alert(error));
  }
  resset = "";
  finalset = "";
  public deleteuser() {
    const user = this.userdeletion_object;
    console.log(user);

    const userEvent: ITrackUserEvent = {
      employeeId: user['employee_id'],
      event: TrackUserEvent.TYPE_USER_DELETED,
      userName: user['user_name']
    }
    //alert(this.userdeletion_object['id']);
    return this.cs.postData({ sourceid: 'calldbproc', info: { procname: 'delete_user', vals: [user['id']] } })
      .pipe(
        concatMap(res => {
          return this.trackingService.trackAnnotationEvent({
            uid: this.cs.user_session.id,
            type: TrackingTypes.TYPE_USER,
            data: JSON.stringify(userEvent),
          }).pipe(map(_ => res))
        })
      )
      .toPromise()
      .then((data: any) => {
        //console.log(JSON.stringify(data));
        if (data.status == 1) {
          $('#tbllistid').DataTable().ajax.reload();
          this.mdls.closepop();
          this.cs.openGrowl('', 'Status', 'Deleted successfully');
        } else {
          this.cs.openGrowl('', 'Status', 'Some error Occured');
        }
      })
      .catch(console.error);

  }
  updatepwd() {
    if (this.resetpwds.newpwd == this.resetpwds.retypepwd) {
      this.cs.postData({ sourceid: 'auth/resetpwd', info: { id: this.userdeletion_object['id'], resetpwd: this.md5Service.getMd5(this.resetpwds.newpwd) } })
        .subscribe(data => {
          // alert(JSON.stringify(data));
          if (data['status'] == 1) {
            // this.mdls.dismiss();
            //
            this.resetpwds = { newpwd: '', retypepwd: "" };
            this.resetpwd_validation = "";
            this.cs.openGrowl('', 'Status', 'Password Updated Sucessfully');
            this.mdls.closepop();
          } else {
            this.resetpwd_validation = "Some Error occured";
          }
        })
    } else {
      this.resetpwd_validation = "New and Re-enter Passwords don't match";
    }
  }
  update_accessrights() {
    this.cs.postData({ sourceid: 'listmgr', info: { tdata: { access_rights: JSON.stringify(this.access_rights) }, query: 'users', pdata: { id: 'id', value: this.userdeletion_object['id'] } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          this.access_rights = [false, false, false, false];
          this.mdls.closepop();
          this.cs.openGrowl('', 'Status', 'Updated User Access Rights Successfully');
        } else {
          this.formvalidation = 'Some error Occurred';
        }
      }, error => console.log(error))
  }
  getaccessrights(id) {
    //  alert(id);
    this.userdeletion_object['id'] = id;
    this.cs.postData({ sourceid: 'listingdetails', info: { query: 'users', pdata: { id: 'id', value: this.userdeletion_object['id'] }, selcolumns: ['access_rights'] } })
      .subscribe(data => {
        console.log(JSON.stringify(data));
        if (data['response']['access_rights'] != '') {
          this.access_rights = JSON.parse(data['response']['access_rights']);
        }

      }, error => alert(error))
  }
  getdtllistings() {
    const that = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: ID No, User Name', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [5, "desc"], scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "users_view";
        dataTablesParameters['dtfilters'] = this.dtfilters;
        const userFilterQuery = this.cs.user_session.user_type == 1 ? `user_type>=1` : '1=1';
        const query = dataTablesParameters['search']['value'];
        dataTablesParameters['searchquery'] = ` where ${userFilterQuery} and (employee_id like '%${query}%' or  user_name like '%${query}%')  `
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        this.tbl_start = dataTablesParameters['start'];
        that.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            //  alert(JSON.strinfigy(resp));
            // that.ls.listing_data = resp.data;
            // this.userscount=resp.recordsTotal+1;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          }, error => {
            console.log("Rrror", error);
          });
      },

      // note: column order in this array affects table sort in server
      columns: [
        // do not remove this column, it affects column sort in server 
        { data: 'index', visible: false },
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          width: '8%',
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'employee_id', title: 'ID No.' },
        { data: 'user_name', title: 'User Name' },
        {
          data: 'user_type',
          title: 'Role',
          render: (val) => {
            if (val == 0) {
              return 'Super Admin';
            } else if (val == 1) {
              return 'Administrator';
            } else if (val == 2) {
              return 'Operator';
            } else if (val == 3) {
              return 'Maintainer';
            }
          }
        },
        {
          data: 'creation_date',
          title: 'Date and Time',
          render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a')
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          visible: that.cs.user_session.user_type <= 1,
          width: '8%',
          createdCell: (cell, _, row) => {
            if (that.cs.user_session.user_type > 1) return;
            // clear old contents
            $(cell).html('');

            // column content
            const btn = $(`
            <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
              <i class="lni lni-cog">
            </button>
            `)
              .appendTo(cell as HTMLElement);

            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [
                  { title: "Edit", cmd: "edit", uiIcon: "ui-icon-pencil" },
                  { title: "Delete", cmd: "delete", uiIcon: "ui-icon-trash", disabled: that.cs.user_session.id == row['id'] || [0, 1].includes(row['user_type']) },
                  { title: "Reset Password", cmd: "resetpwd", uiIcon: "ui-icon-refresh" },
                  { title: "View Login History", cmd: "loginhistry", uiIcon: "ui-icon-comment" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');


                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      // that.editform(that.editmember, rowId, itemIndex);
                      that.editform(that.addmember, row['id'])
                    } else if (ui.cmd == 'delete') {
                      // that.opendelconf(rowId, that.deletbkms);
                      that.delete_userconfirmation(that.deletemember, row)
                    } else if (ui.cmd == 'resetpwd') {
                      // that.opendelconf(rowId, that.deletbkms);
                      that.delete_userconfirmation(that.forgotpwdmdl, row)
                    } else if (ui.cmd == 'loginhistry') {
                      // that.opendelconf(rowId, that.deletbkms);
                      that.gotoLoginHistory(row)
                    }
                  } catch (err) { console.error(err); }
                }
              });

            // quick hack for left-click menu
            $(btn).on('click', function () {
              $(btn).trigger('contextmenu');
            });

            return btn.html();
          }
        },
      ],
      columnDefs: [
        { targets: '_all', defaultContent: '' }
      ]

    };
  }

  ngAfterViewInit() {
    this.reloadTable();
  }
  printData() {
    // console.log('printData called');
    // hide 1st and last column + rows of table
    // hide last column + rows of table
    const thSelector = `.table thead th:last-child`;
    const tbSelector = `.table tbody td:last-child`;
    $(thSelector).hide();
    $(tbSelector).hide();
    // print request


    // print request
    const headers = $(`.table thead`).html();
    const tbody = $(`.table tbody`).html();
    this.printDataService.printContent({
      data: {
        thead: headers,
        tbody
      },
      type: PrintDataTypes.TYPE_TABLE
    })
      .subscribe(
        _ => {
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
        },
        err => {
          console.error(err);
          // reset table UI
          $(thSelector).show();
          $(tbSelector).show();
        }
      )
  }
  public ngOnInit() {
    this.cs.page_header = "Manage Users";
    this.getdtllistings();
  }
  reloadTable() {
    // this.dtElement.dtInstance.then(instance => instance.ajax.reload());
    this.dtTrigger.next();
  }


}
