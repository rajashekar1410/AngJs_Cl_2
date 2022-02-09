import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DateFormatPipe } from 'ngx-moment';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { PrintDataTypes } from '../../../print-data/models/print-data-type';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { TrackingTypes } from '../../models/tracking-data';

@Component({
  selector: 'app-user-logins-listing',
  templateUrl: './user-logins-listing.component.html',
  styleUrls: ['./user-logins-listing.component.scss']
})
export class UserLoginsListingComponent implements OnInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private router: Router,
    private printDataService: PrintDataService
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav) {
      const extras = nav.extras;
      if (extras) {
        const state = extras.state;
        if (state) {
          const { user_id, user_name } = state;
          if (user_id) {
            this.userId = user_id;
            this.userName = user_name;
          }
        }
      }
    }
    if (this.userId == -1) {
      // access denied, goto dashboard
      this.router.navigateByUrl('/home/dashboard');
    }
  }

  contentList: any[] = []
  dtOptions: DataTables.Settings = {}
  dtFilters = {};

  tbl_start = 0;

  dataSub$: Subscription = null;

  userId = -1;
  userName = '';

  ngOnInit(): void {
    // Enable page nav buttons
    this.cs.emitChange('1');
    // Set page title
    this.cs.page_header = `Login History: '${this.userName}'`;
    // Init stuff
    const self = this;
    // set user_id filter
    this.dtFilters['uid'] = this.userId;
    this.dtOptions = {
      language: { search: "Find:", emptyTable: 'No data found' },
      pageLength: 10, serverSide: true, processing: false, searching: false,
      lengthChange: true, order: [2, 'desc'], scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "user_logins_view";
        dataTablesParameters['dtfilters'] = this.dtFilters;
        // dataTablesParameters['searchquery'] = " and (page_title like '%" + dataTablesParameters['search']['value'] + "%' or employee_id like '%" + dataTablesParameters['search']['value'] + "%' or  user_name like '%" + dataTablesParameters['search']['value'] + "%')";
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        this.tbl_start = dataTablesParameters['start'];
        self.dataSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            // console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {
              // self.contentList = resp.data;
              // this.userscount=resp.recordsTotal+1;
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: resp.data
              });
            }
          }, error => {
            console.log("Rrror", error);
          });
      },
      // note: column order in this array affects table sort in server
      columns: [
        // note: `defaultContent` is mandatory else DT will throw error
        // that index column doesn't have value (from server's AJAX)
        // and its right as that data is set dynamically in `rowCallback`
        { data: 'index', visible: true, title: '#', defaultContent: '' },
        { data: 'id', visible: false },
        { data: 'in_time', visible: true, title: 'Login Date and Time' },
        { data: 'out_time', visible: true, title: 'Logout Date and Time' },
        { data: 'user_name', visible: false },
        { data: 'user_type_name', visible: false },
        { data: 'uid', visible: false },
      ],
      columnDefs: [
        { orderable: false, targets: [0, 1] },
        // { targets: [0, 1, 2, 3, 4], visible: true },
        // { targets: '_all', visible: true }
      ],
      rowCallback: (row, data, index) => {
        const visibleColumns = this.dtOptions['columns'].filter(x => x.visible);
        // Set index cell data
        const rIndex = visibleColumns.findIndex(x => x.data == 'index');
        const td = $(row.childNodes.item(rIndex));
        td.text(++index + this.tbl_start);
        /*// set user activity type (+1 because index column is added dynamically)
        const colIndex = visibleColumns.findIndex(x => x.data == 'page_type');
        if (colIndex > 0) {
          const remarksCell = row.childNodes.item(colIndex) as HTMLElement;
          const activityType = this.determineActivityType(data['page_type'], data);
          $(remarksCell).html(activityType);
        }
        // Set username with employee_id
        const uIndex = visibleColumns.findIndex(x => x.data == 'user_name');
        const ur = $(row.childNodes.item(uIndex));
        ur.html(`<b>Name: </b>${ur.text()} <br><b>Employee ID: </b> (${data['employee_id']})`);
        */
        // set date in format
        this.updateDateFormat(row, visibleColumns, data);
        /*const dateCellIndex = visibleColumns.findIndex(x => x.data == 'date');
        const dateCell = row.childNodes.item(dateCellIndex);
        const dateTimestamp = $(dateCell).text();
        $(dateCell).text(new DateFormatPipe().transform(dateTimestamp, 'MMM  Do YYYY, hh:mm a'))*/

      },
      autoWidth: true,
    };
  }

  private updateDateFormat(row: Node, columns: DataTables.ColumnSettings[], data) {
    const datePipe = new DateFormatPipe();

    const inTimeCellIndex = columns.findIndex(x => x.data == 'in_time');
    const outTimeCellIndex = columns.findIndex(x => x.data == 'out_time');
    const inTimeCell = row.childNodes.item(inTimeCellIndex);
    const outTimeCell = row.childNodes.item(outTimeCellIndex);

    const inTime = data['in_time'];
    const outTime = data['out_time'];

    if (inTime == '0000-00-00 00:00:00') {
      $(inTimeCell).text('Failed to login correctly');
    } else {
      $(inTimeCell).text(datePipe.transform(inTime, 'MMM  Do YYYY, hh:mm:ss a'));
    }
    if (outTime == '0000-00-00 00:00:00') {
      $(outTimeCell).text('Session currently active or failed to logout correctly');
    } else {
      $(outTimeCell).text(datePipe.transform(outTime, 'MMM  Do YYYY, hh:mm:ss a'));
    }
  }

  determineActivityType(type: number, data) {
    let actionText = '', dataText = [];
    switch (type) {
      case TrackingTypes.TYPE_PAGE_ACCESS:
        actionText = 'Document was accessed';
        dataText[0] = 'Page Title:'
        dataText[1] = data['page_title'];
        break;
      case TrackingTypes.TYPE_PRINT_PDF:
        actionText = 'Page was printed';
        dataText[0] = 'Page Title:'
        dataText[1] = data['page_title'];
        break;
      case TrackingTypes.TYPE_GLOBAL_SEARCH:
        actionText = 'Search was used';
        dataText[0] = 'Search Term:'
        dataText[1] = data['gs_query'];
        break;
      case TrackingTypes.TYPE_PWD_CHANGE:
        actionText = 'Account password was updated';
        dataText[0] = ''
        dataText[1] = '';
        break;
      case TrackingTypes.TYPE_SECURITY_QUE_CHANGE:
        actionText = 'Account security questions were updated';
        dataText[0] = ''
        dataText[1] = '';
        break;

    }
    return `
      <b>Action:</b> ${actionText}<br>
      <b>${dataText[0]}</b> ${dataText[1]}
    `;
  }

  openPage(page_id) {
    // alert(cat+">>>???"+id);
    this.cs.selpage_id = page_id;
    // Fetch module info from page
    this.cs.postData({ sourceid: 'listings', info: { listing_filters: { filtercols: { id: page_id }, query: 'pages', selected_colnames: ['id', 'page_category', 'page_module'], search_keyword: '', search_query: '', limit: '', offset: '0', ordercolumn: 'id', ordertype: 'desc' } } })
      .subscribe((data: any) => {
        if (data.status == 1) {
          console.log(data)
          if (data.response.length > 0) {
            const { page_module, page_category } = data.response[0];
            this.router.navigate(['/home/pages/pagecmp/' + page_module + '/' + page_category]);
          } else {
            this.cs.openGrowl('', 'Status', 'Annotation unavailable.')
          }
        } else {
          this.cs.openGrowl('', 'Status', 'Annotation unavailable.')
        }
      },
        err => {
          console.error(err);
          this.cs.openGrowl('', 'Status', 'Internal error.')
        });

    // this.router.navigateByUrl('/home')
  }
  printData() {
    // console.log('printData called');
    // print request
    const headers = $('#tbllistid_wrapper thead').html();
    const tbody = $('#tbllistid_wrapper tbody').html();
    this.printDataService.printContent({
      data: {
        thead: headers,
        tbody
      },
      type: PrintDataTypes.TYPE_TABLE
    })
      .subscribe(
        _ => { },
        err => {
          console.error(err);
        })
  }

  ngOnDestroy() {
    // reset
    this.contentList = [];
    this.dtOptions = {}
    this.dtFilters = {};
    this.tbl_start = 0
    this.dataSub$?.unsubscribe();
  }

}
