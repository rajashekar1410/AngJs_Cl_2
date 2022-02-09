import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { TrackingTypes, TrackingTypeArray, ITrackingTypeArrayItem } from '../../models/tracking-data';
import { DateFormatPipe } from 'ngx-moment';
import { DataTableDirective } from 'angular-datatables';
import { PrintDataTypes } from '../../../print-data/models/print-data-type';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { ITrackBookmarkEvent, TrackBookmarkEvent } from '../../models/track-bookmark';
import { ITrackAnnotationEvent, TrackAnnotationEvent, TrackAnnotationEventPrivacy } from '../../models/track-annotation';
import { ITrackUserEvent, TrackUserEvent } from '../../models/track-user';
import { ITrackGlossaryEvent, TrackGlossaryEvent } from '../../models/track-glossary';
import { ITrackInventoryEvent } from '../../models/track-inventory';
import { InventoryActionTypes } from '../../../inventory/models/inventory-tracking';
import { ITrackLogAddUpdEvent, ITrackLogsEvent, LogActionTypes } from '../../models/track-logs';
import * as moment from 'moment';

@Component({
  selector: 'app-tracking-listing',
  templateUrl: './tracking-listing.component.html',
  styleUrls: ['./tracking-listing.component.scss']
})
export class TrackingListingComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private router: Router,
    private printDataService: PrintDataService
  ) { }

  dtOptions: DataTables.Settings = {}
  dtFilters = {};
  dtTrigger = new Subject();

  tbl_start = 0;

  trackingTypeArray = TrackingTypeArray.filter(x => x.minUserType >= this.cs.user_session.user_type);
  selectedTrackingType: ITrackingTypeArrayItem = this.trackingTypeArray[0];

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  dataSub$: Subscription = null;

  // date picker
  fromDate = moment().startOf('month').toDate();
  toDate = new Date();

  ngOnInit(): void {
    // Enable page nav buttons
    this.cs.emitChange('1');
    // Page title
    this.cs.page_header = 'View User Activity';
    // Init stuff
    const self = this;
    if (this.cs.user_session['user_type'] > 1) {
      this.dtFilters['uid'] = this.cs.user_session['id'];
      // some users don't have access to Print feature so hide "Print History" filter
      this.trackingTypeArray = this.trackingTypeArray.filter(x => ![TrackingTypes.TYPE_PRINT_PDF].includes(x.id))
    } else if (this.cs.user_session['user_type'] == 1) {
      // hide superadmin activity from admin accounts
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = 'utype>0';
    } else {
      this.dtFilters['1'] = 1;
    }
    this.dtOptions = {
      language: { search: "Find:", searchPlaceholder: 'By: Page Name, User Name, Employee ID', emptyTable: 'No data found' },
      pageLength: 10, serverSide: true, processing: false, searching: true, searchDelay: 450,
      lengthChange: true, lengthMenu: [10, 25, 50, 100, 500, 1000, 2000], order: [6, 'desc'], scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "user_activity_view";
        dataTablesParameters['dtfilters'] = this.dtFilters;
        dataTablesParameters['searchquery'] = ` and (page_title like '%${dataTablesParameters['search']['value']}%' or employee_id like '%${dataTablesParameters['search']['value']}%' or  user_name like '%${dataTablesParameters['search']['value']}%') AND date BETWEEN '${moment(this.fromDate).startOf('day').toISOString(true)}' AND '${moment(this.toDate).endOf('day').toISOString(true)}'`;
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
        { data: 'page_title', visible: false },
        { data: 'gs_query', visible: false },
        { data: 'user_name', title: 'User with Employee ID', visible: true },
        { data: 'page_type', title: 'Activity', visible: true },
        { data: 'date', title: 'Created Date', visible: true },
        { data: 'employee_id', visible: false },
        { data: 'uid', visible: false },
        { data: 'page_id', visible: false },
        { data: 'ua_data', visible: false },
        { data: 'page_module', visible: false },
        { data: 'page_category', visible: false },
      ],
      columnDefs: [
        { orderable: false, targets: [0, 1, 2] },
        // { targets: [0, 1, 2, 3, 4], visible: true },
        // { targets: '_all', visible: true }
      ],
      rowCallback: (row, data, index) => {
        const visibleColumns = this.dtOptions['columns'].filter(x => x.visible);
        // Set index cell data
        const rIndex = visibleColumns.findIndex(x => x.data == 'index');
        const td = $(row.childNodes.item(rIndex));
        td.text(++index + this.tbl_start);
        // set user activity type (+1 because index column is added dynamically)
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

        // set date in format
        const dateCellIndex = visibleColumns.findIndex(x => x.data == 'date');
        const dateCell = row.childNodes.item(dateCellIndex);
        const dateTimestamp = $(dateCell).text();
        $(dateCell).text(new DateFormatPipe().transform(dateTimestamp, 'MMM  Do YYYY, hh:mm a'))
      },
      autoWidth: true,
    };
  }
  ngAfterViewInit() {
    // Need a setTimeout so `cs.page_categories` array is populated 
    setTimeout(() => {
      this.trackingTypeArray = this.trackingTypeArray.filter(e => {
        switch (e.id) {
          case TrackingTypes.TYPE_INVENTORY:
            return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 6));
          case TrackingTypes.TYPE_LOGS:
            return this.cs.isPageCategoryAccessible(this.cs.page_categories.find(e => e['id'] == 7));
          default:
            return true;
        }
      });
      // load table after filter is applied
      this.reloadTable();
    }, 700);
  }
  changeActivityType(type: TrackingTypes) {
    const actionType = TrackingTypeArray.find(x => x.id == type);
    if (!actionType) {
      return '--'
    }
    this.selectedTrackingType = actionType;
    if (actionType.id == TrackingTypes.TYPE_ALL) {
      this.dtFilters['1'] = '1';
      delete this.dtFilters['page_type'];
    } else {
      this.dtFilters['page_type'] = actionType.id;
      delete this.dtFilters['1'];
    }
    this.reloadTable();
  }

  determineActivityType(type: number, data) {
    const actionType = TrackingTypeArray.find(x => x.id == type);
    if (!actionType) {
      return '--'
    }
    // Set content accessed info.
    switch (type) {
      case TrackingTypes.TYPE_PAGE_ACCESS:
        actionType.dataText = data['page_title'];
        switch (data['page_category']) {
          case 1:
            actionType.actionText = 'Document was accessed.';
            break;
          case 2:
            actionType.actionText = 'Manual was accessed.';
            break;
          case 3:
            actionType.actionText = 'Drawing content was accessed.';
            break;
          default:
            actionType.actionText = 'Unknown content was accessed';
            break;
        }
      case TrackingTypes.TYPE_PRINT_PDF:
        actionType.dataText = data['page_title'];
        break;
      case TrackingTypes.TYPE_GLOBAL_SEARCH:
        actionType.dataText = data['gs_query'];
        break;
      case TrackingTypes.TYPE_BOOKMARKS:
        try {
          const bookmarkEvent: ITrackBookmarkEvent = JSON.parse(data['ua_data']);
          actionType.dataText = bookmarkEvent.bookmarkName;
          switch (bookmarkEvent.event) {
            case TrackBookmarkEvent.TYPE_BKM_ADDED:
              actionType.actionText = 'Bookmark was added';
              break;
            case TrackBookmarkEvent.TYPE_BKM_EDITED:
              actionType.actionText = 'Bookmark was modified';
              break;
            case TrackBookmarkEvent.TYPE_BKM_DELETED:
              actionType.actionText = 'Bookmark was removed';
              break;
          }
        } catch (_) {
          actionType.actionText = 'ERROR';
        }
        break;
      case TrackingTypes.TYPE_ANNOTATIONS:
        try {
          const annotationEvent: ITrackAnnotationEvent = JSON.parse(data['ua_data']);
          const privacy = annotationEvent.privacy == TrackAnnotationEventPrivacy.TYPE_NOTES ? 'Notes' : 'Feedback to Administrator'
          actionType.dataText = `${annotationEvent.annotationName} (${privacy})`;
          switch (annotationEvent.event) {
            case TrackAnnotationEvent.TYPE_ANT_ADDED:
              actionType.actionText = 'Annotation was added';
              break;
            case TrackAnnotationEvent.TYPE_ANT_EDITED:
              actionType.actionText = 'Annotation was modified';
              break;
            case TrackAnnotationEvent.TYPE_ANT_DELETED:
              actionType.actionText = 'Annotation was removed';
              break;
            case TrackAnnotationEvent.TYPE_ANT_PRINTED:
              actionType.actionText = 'Annotation was printed';
              break;
          }
        } catch (_) {
          actionType.actionText = 'ERROR';
        }
        break;
      case TrackingTypes.TYPE_USER:
        try {
          const userEvent: ITrackUserEvent = JSON.parse(data['ua_data']);
          switch (userEvent.event) {
            case TrackUserEvent.TYPE_USER_ADDED:
              actionType.actionText = `New User '${userEvent.userName} (${userEvent.employeeId})' was added`;
              break;
            case TrackUserEvent.TYPE_USER_EDITED:
              actionType.actionText = `User info of '${userEvent.userName} (${userEvent.employeeId})' was updated`;
              break;
            case TrackUserEvent.TYPE_USER_DELETED:
              actionType.actionText = `User account '${userEvent.userName} (${userEvent.employeeId})' was removed`;
              break;
          }
        } catch (_) {
          console.log(_)
          actionType.actionText = 'ERROR';
        }
        break;
      case TrackingTypes.TYPE_GLOSSARY:
        try {
          const glossaryEvent: ITrackGlossaryEvent = JSON.parse(data['ua_data']);
          const glTypeName = glossaryEvent.glType == 1 ? 'Abbrevation' : 'Definition';
          switch (glossaryEvent.event) {
            case TrackGlossaryEvent.TYPE_GL_ADDED:
              actionType.actionText = `Glossary ${glTypeName} '${glossaryEvent.glTitle}' was added`;
              actionType.dataTitle = '';
              actionType.dataText = '';
              break;
            case TrackGlossaryEvent.TYPE_GL_EDITED:
              actionType.actionText = `Glossary ${glTypeName} item '${glossaryEvent.glTitle}' was updated`;
              actionType.dataTitle = '';
              actionType.dataText = '';
              break;
            case TrackGlossaryEvent.TYPE_GL_DELETED:
              const glData = JSON.parse(glossaryEvent.glData).map(el => el.golssary_name)
              actionType.actionText = `Glossary item(s) were removed`;
              actionType.dataTitle = 'Items:';
              actionType.dataText = glData;
              break;
            case TrackGlossaryEvent.TYPE_GL_PRINTED:
              actionType.actionText = `Glossary data were printed`;
              actionType.dataTitle = '';
              actionType.dataText = '';
              break;
          }
        } catch (_) {
          console.log(_)
          actionType.actionText = 'ERROR';
        }
        break;
      case TrackingTypes.TYPE_INVENTORY:
        try {
          const invEvent: ITrackInventoryEvent = JSON.parse(data['ua_data']);
          const invName = invEvent.data['invDesc'] || invEvent.data['invPartNo'];
          switch (invEvent.event) {
            case InventoryActionTypes.TYPE_I_ADD:
              actionType.actionText = `Inventory item '${invName}' was added`;
              actionType.dataTitle = '';
              actionType.dataText = '';
              break;
            case InventoryActionTypes.TYPE_I_EDIT:
              actionType.actionText = `Inventory item '${invName}' was updated`;
              actionType.dataTitle = '';
              actionType.dataText = '';
              break;
            case InventoryActionTypes.TYPE_I_DEL:
              actionType.actionText = `Inventory item '${invName}' was removed.`;
              actionType.dataTitle = '';
              actionType.dataText = '';
              break;
            case InventoryActionTypes.TYPE_I_CONSUMED:
              actionType.actionText = `Inventory item '${invName}' was consumed.`;
              actionType.dataTitle = '';
              actionType.dataText = `<b>Quantity:</b> ${invEvent.data['consumed']}<br><b>Remarks:</b> ${invEvent.data['remarks']}`;
              break;
            case InventoryActionTypes.TYPE_I_DEMANDED:
              actionType.actionText = `Inventory item '${invName}' quantity increase requested`;
              actionType.dataTitle = '';
              actionType.dataText = `<b>Quantity:</b> ${invEvent.data['demanded']}<br><b>Remarks:</b> ${invEvent.data['remarks']}`;
              break;
            case InventoryActionTypes.TYPE_I_RECEIVED:
              actionType.actionText = `Inventory item '${invName}' quantity increase accepted`;
              actionType.dataTitle = '';
              actionType.dataText = `<b>Quantity:</b> ${invEvent.data['received']}<br><b>Remarks:</b> ${invEvent.data['remarks']}`;
              break;
            case InventoryActionTypes.TYPE_I_CANCELLED:
              actionType.actionText = `Inventory item '${invName}' quantity increase was cancelled`;
              actionType.dataTitle = '';
              actionType.dataText = `<b>Quantity:</b> ${invEvent.data['received']}<br><b>Remarks:</b> ${invEvent.data['remarks']}`;
              break;
          }
        } catch (_) {
          console.log(_)
          actionType.actionText = 'ERROR';
        }
        break;
      case TrackingTypes.TYPE_LOGS:
        try {
          const logEvent: ITrackLogsEvent = JSON.parse(data['ua_data']);
          const logData = logEvent.data as ITrackLogAddUpdEvent;
          switch (logEvent.event) {
            case LogActionTypes.TYPE_LOG_ADDED:
              actionType.actionText = `New Log entry was added`;
              actionType.dataTitle = 'Info:';
              actionType.dataText = `Off Time: ${logData.swOffDateTime}`;
              break;
            case LogActionTypes.TYPE_LOG_EDITED:
              actionType.actionText = `Log entry was updated`;
              actionType.dataTitle = 'Info:';
              actionType.dataText = `Off Time: ${logData.swOffDateTime}`;
              break;
            case LogActionTypes.TYPE_LOG_DELETED:
              actionType.actionText = `Log entry was removed`;
              actionType.dataTitle = 'Info:';
              actionType.dataText = `Off Time: ${logData.swOffDateTime}`;
              break;
          }
        } catch (_) {
          console.log(_)
          actionType.actionText = 'ERROR';
        }
        break;
    }
    return `
      <b>Action:</b> ${actionType.actionText}<br>
      <b>${actionType.dataTitle}</b> ${actionType.dataText}
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
    // set title for all filters except "All"
    const title = this.selectedTrackingType.id != this.trackingTypeArray[0].id ? `(${this.selectedTrackingType.text})` : '';
    this.printDataService.printContent({
      data: {
        thead: headers,
        tbody
      },
      type: PrintDataTypes.TYPE_TABLE,
      title: `View User Activity ${title}`
    })
      .subscribe(
        _ => { },
        err => {
          console.error(err);
        }
      )
  }

  reloadTable() {
    this.dtElement?.dtInstance?.then(instance => instance.ajax.reload());
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    // reset
    this.dtOptions = {}
    this.dtFilters = {};
    this.tbl_start = 0
    this.dataSub$?.unsubscribe();
    this.dtTrigger.unsubscribe();
  }




}
