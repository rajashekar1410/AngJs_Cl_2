import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ApplicationRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { of, Subject, Subscription } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { CommonService } from 'src/app/core/services/common/common.service';
import { ISContentTypes } from '../../../intelligent-search/models/intelligent-search';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { ITrackInventoryEvent, ITrackInvRecvCancelEvent } from '../../../user-tracking/models/track-inventory';
import { TrackingTypes } from '../../../user-tracking/models/tracking-data';
import { UserTrackingService } from '../../../user-tracking/services/user-tracking/user-tracking.service';
import { InventoryActionArray, InventoryActionTypes, InventoryReportTypes } from '../../models/inventory-tracking';
import { DataTableDirective } from 'angular-datatables';

@Component({
  selector: 'app-inventory-reports',
  templateUrl: './inventory-reports.component.html',
  styleUrls: ['./inventory-reports.component.scss']
})
export class InventoryReportsComponent implements OnInit, AfterViewInit, OnDestroy {


  public searchdtOptions: DataTables.Settings = {};
  public searchlistid = 0;

  private dtInstanceSub: Subscription = null;

  contentList = [];
  pageTitle = '';
  dtTrigger = new Subject();
  @ViewChild(DataTableDirective, { static: true })
  dtElement: DataTableDirective;

  fetchData1Sub$: Subscription = null;
  fetchData2Sub$: Subscription = null;
  printDataSub$: Subscription = null;

  // inventory item
  invInfo = {
    id: -1,
    description: '',
    part_no: '',
    total: -1,
    consumed: -1,
    available: -1
  };
  inventoryActionTypes = InventoryActionTypes;

  inventoryReport: InventoryReportTypes = null;
  inventoryReportTypes = InventoryReportTypes;

  dtFilters = {};
  tbl_start = 0;

  procReqSub$: Subscription = null;
  triggerMarkReceived$ = new Subject();

  // date picker
  fromDate = moment().startOf('month').toDate();
  toDate = new Date();

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private appRef: ApplicationRef,
    public modalRef: BsModalRef,
    private printDataService: PrintDataService,
    private trackingService: UserTrackingService
  ) { }

  ngOnInit() {
    this.updateUI();
    this.initDTOptions();
  }

  updateUI() {
    this.modalRef?.setClass('modal-lg ' + this.cs.default_theme);
    if (this.inventoryReport == InventoryReportTypes.TYPE_ITEM_HISTORY) {
      this.pageTitle = 'Inventory Item History';
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = `id=${this.invInfo.id}  AND date BETWEEN '${moment(this.fromDate).startOf('day').toISOString(true)}' AND '${moment(this.toDate).endOf('day').toISOString(true)}'`;
      // this.dtFilters['hs_q'] = `ua_data LIKE '%"id": ${this.invInfo.id}%' OR ua_data LIKE '%"id":${this.invInfo.id}%'`;
    } else if (this.inventoryReport == InventoryReportTypes.TYPE_OVERALL_HISTORY) {
      this.pageTitle = 'Overall History';
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = `date BETWEEN '${moment(this.fromDate).startOf('day').toISOString(true)}' AND '${moment(this.toDate).endOf('day').toISOString(true)}'`;
    } else if (this.inventoryReport == InventoryReportTypes.TYPE_CONSUMPTION_REPORT) {
      this.pageTitle = 'Consumption Report';
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = `action_type=${InventoryActionTypes.TYPE_I_CONSUMED} AND date BETWEEN '${moment(this.fromDate).startOf('day').toISOString(true)}' AND '${moment(this.toDate).endOf('day').toISOString(true)}'`;
    } else if (this.inventoryReport == InventoryReportTypes.TYPE_CURRENT_ORDERS) {
      this.pageTitle = 'Open Orders';
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = `action_type=${InventoryActionTypes.TYPE_I_DEMANDED} and action_done=0`;
    } else if (this.inventoryReport == InventoryReportTypes.TYPE_RECEIVED_ORDERS) {
      this.pageTitle = 'Received Orders';
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = `action_type=${InventoryActionTypes.TYPE_I_RECEIVED} AND date BETWEEN '${moment(this.fromDate).startOf('day').toISOString(true)}' AND '${moment(this.toDate).endOf('day').toISOString(true)}'`;
    } else if (this.inventoryReport == InventoryReportTypes.TYPE_CANCELLED_ORDERS) {
      this.pageTitle = 'Cancelled Orders';
      this.dtFilters['hs'] = true;
      this.dtFilters['hs_q'] = `action_type=${InventoryActionTypes.TYPE_I_CANCELLED} AND date BETWEEN '${moment(this.fromDate).startOf('day').toISOString(true)}' AND '${moment(this.toDate).endOf('day').toISOString(true)}'`;
    }
  }

  initDTOptions() {
    const self = this;
    const isSearchPossible = [
      InventoryReportTypes.TYPE_CONSUMPTION_REPORT,
      InventoryReportTypes.TYPE_OVERALL_HISTORY,
      InventoryReportTypes.TYPE_RECEIVED_ORDERS,
      InventoryReportTypes.TYPE_CANCELLED_ORDERS
    ].includes(this.inventoryReport);


    // actions column is buggy when not visible
    const isActionsColVisible = this.inventoryReport == this.inventoryReportTypes.TYPE_CURRENT_ORDERS;

    this.searchdtOptions = {
      language: {
        emptyTable: 'No results found',
        searchPlaceholder: 'By Part No, Remarks or Description'
      },
      dom: isSearchPossible ? 'frtp' : 'rtp', destroy: true,
      pageLength: 10, serverSide: true, processing: true, searching: isSearchPossible,
      lengthChange: true, order: [[7, "desc"]], scrollY: "550px", scrollX: true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "inventory_orders_view";
        dataTablesParameters['dtfilters'] = this.dtFilters;
        if (isSearchPossible) {
          // const dbKeyword = (this.dtFilters['hs'] ) ? 'and' : 'where';
          const query = dataTablesParameters['search']['value'];
          dataTablesParameters['searchquery'] = `and (part_no LIKE '%${query}%' or description LIKE '%${query}%' or remarks LIKE '%${query}%')`;
        }
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        self.tbl_start = dataTablesParameters['start'];
        self.fetchData1Sub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            // console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {
              // self.contentList = resp.data?.map(el => {
              //   // el['ua_data'] = JSON.parse(el['ua_data']);
              //   this.renderActionText(el);
              //   return el;
              // });
              // this.userscount=resp.recordsTotal+1;
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: resp.data?.map(el => {
                  try {
                    el['ua_data'] = JSON.parse(el['ua_data']);
                  } catch (_) { }
                  return el;
                })
              });
            }
          }, error => {
            console.log("Rrror", error);
            callback({
              recordsTotal: 0,
              recordsFiltered: 0,
              data: []
            });
          });
      },


      columns: [
        // note: need 'index' and '1' columns so sorting works
        { data: 'index', visible: false },
        { data: '1', visible: false },
        { data: 'part_no', title: 'Part No.', width: '12%' },
        { data: 'description', title: 'Item Description', width: '15%' },
        {
          data: 'action_type', title: 'Event', width: '20%',
          createdCell: (cell) => {
            // clear old content
            $(cell).html('');

            const row = $("#searchlist_table").DataTable().row(cell).data();
            const newData = self.renderActionText(row);

            // render output
            $(cell).html(newData);
          }

        },
        { data: 'quantity', title: 'Quantity', width: '8%' },
        {
          data: 'remarks', title: 'Remarks', width: '15%', createdCell: (cell) => {
            // clear old content
            $(cell).html('');

            const row = $("#searchlist_table").DataTable().row(cell).data();
            const newData = self.renderRemarks(row);

            // render output
            $(cell).html(newData);
          }
        },
        {
          data: 'date', title: 'Date', width: '18%',
          render: (val) => moment(val).format('MMM  Do YYYY, hh:mm a')
        },
        { data: 'user_name', title: 'User', },

        { data: 'employee_id', width: '10%', visible: false },
        { data: 'id', visible: false, width: '10%' },
        { data: 'action_done', visible: false },
        { data: 'io_id', visible: false },
        { data: 'io_remarks', visible: false },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          visible: isActionsColVisible, width: '10%',
          createdCell: (cell) => {
            if (!isActionsColVisible) return;
            // clear old contents
            $(cell).html('');

            if (self.cs.user_session.user_type != 1) {
              // update UI
              $(cell).html('<span class="text-danger"><b>ACCESS DENIED</b></span>');
              return;
            };

            // column content
            const btn = $(`
            <button class="btn btn-link btn-sm dropdown-toggle d-block mx-auto" type="button">
              <i class="lni lni-cog">
            </button>
            `)
              .appendTo(cell as HTMLElement);
            const userId = $("#searchlist_table").DataTable().row(cell).data();
            console.log(userId);

            // context menu init
            ($ as any)(cell)
              .contextmenu({
                delegate: "button",
                menu: [
                  { title: "Mark as Received", cmd: "received", uiIcon: "ui-icon-check", disabled: self.cs.user_session.user_type != 1 },
                  { title: "Cancel this Order", cmd: "cancel", uiIcon: "ui-icon-closethick", disabled: self.cs.user_session.user_type != 1 },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');
                    const row = $("#searchlist_table").DataTable().row(cellItem).data();


                    // console.log(itemIndex);
                    if (ui.cmd == 'received') {
                      self.triggerMarkReceived(row);
                      // that.editform(that.editmember, rowId, itemIndex);
                      //  self.editform(that.addmember, rowId)
                    } else if (ui.cmd == 'cancel') {
                      self.triggerMarkCancelled(row);
                      // that.opendelconf(rowId, that.deletbkms);
                      //  self.delete_userconfirmation(that.deletemember,rowId)
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
      ],
      drawCallback: () => {
        // refresh
        self.appRef.tick();
        // adjust column width on pagination
        setTimeout(() => {
          self.dtElement?.dtInstance?.then(i => i.columns.adjust());
        }, 300);
      }
    };
  }

  renderRemarks(el) {
    if ([
      this.inventoryActionTypes.TYPE_I_DEL,
      this.inventoryActionTypes.TYPE_I_EDIT,
    ].includes(el.action_type)) {
      return el.remarks;
    } else if ([
      this.inventoryActionTypes.TYPE_I_ADD,
      this.inventoryActionTypes.TYPE_I_CONSUMED,
      this.inventoryActionTypes.TYPE_I_DEMANDED,
      this.inventoryActionTypes.TYPE_I_RECEIVED,
      this.inventoryActionTypes.TYPE_I_CANCELLED,
    ].includes(el.action_type)) {
      return el.io_remarks;
    }
  }

  renderActionText(el) {
    let actionType = InventoryActionArray.find(e => e.id == el.action_type);
    if (!actionType) {
      return '--';
    }
    return actionType.actionText;
  }

  triggerMarkReceived(el) {
    // console.log('input el:');
    // console.log(el);
    // 1. set action_done to 1 for current row
    this.procReqSub$ = this.cs.postData({
      sourceid: 'listmgr',
      info: { tdata: { action_done: 1 }, query: 'inventory_orders', pdata: { id: 'id', value: el.io_id } }
    })
      .pipe(
        // 2. create new row for mark as received event in inventory_orders
        concatMap(res => {
          const values = {
            inv_id: el.id,
            action_type: this.inventoryActionTypes.TYPE_I_RECEIVED,
            uid: this.cs.user_session.id,
            quantity: el.quantity,
            remarks: el.io_remarks,
            action_done: 1,
            date: new Date()
          }
          return this.cs.postData({
            sourceid: 'listmgr',
            info: { tdata: values, query: 'inventory_orders', pdata: { id: 'id', value: '' } }
          })
            .pipe(

              concatMap(_ => {
                /**
                  * 1. Get current total value for given inventory item
                  * 2. sum(total+demanded) and update inventory table
                  *
                  */
                return this.cs.postData({
                  sourceid: 'listingdetails', info: {
                    query: 'inventory', pdata: { id: 'id', value: el.id },
                    selcolumns: ['id', 'total']
                  }
                })
                  .pipe(
                    concatMap((res2: any) => {
                      if (res2.status == 1) {
                        return this.cs.postData({
                          sourceid: 'listmgr',
                          info: {
                            tdata: {
                              total: parseInt(res2.response.total.toString()) + parseInt(el.quantity.toString())
                            }, query: 'inventory', pdata: { id: 'id', value: el.id }
                          }
                        }).pipe(
                          concatMap((res: any) => {
                            const invEvent: ITrackInventoryEvent = {
                              event: InventoryActionTypes.TYPE_I_RECEIVED,
                              data: <ITrackInvRecvCancelEvent>{
                                invDesc: el.description,
                                invPartNo: el.part_no,
                                received: el.quantity,
                                remarks: el.io_remarks,
                                inv_id: el.id
                              }
                            };
                            return this.trackingService.trackInventoryEvent({
                              type: TrackingTypes.TYPE_INVENTORY,
                              data: JSON.stringify(invEvent),
                              uid: this.cs.user_session.id
                            }).pipe(map(_ => res))
                          }),
                          map(_ => res)
                        )
                      } else {
                        return of(res);
                      }
                    })
                  )
              }))
        })
      )
      .subscribe(
        _ => {
          this.cs.openGrowl('', 'Status', 'Order received successfully');
          this.reloadTable();
          // inform listings component to update UI
          this.triggerMarkReceived$.next();
        },
        err => {
          console.error(err);
        }
      )
  }

  triggerMarkCancelled(el) {
    // 1. set action_done to 1 for current row
    this.procReqSub$ = this.cs.postData({
      sourceid: 'listmgr',
      info: { tdata: { action_done: 1 }, query: 'inventory_orders', pdata: { id: 'id', value: el.io_id } }
    })
      .pipe(
        // 2. create new row for cancelled event in inventory_orders
        concatMap(_ => {
          const values = {
            inv_id: el.id,
            action_type: InventoryActionTypes.TYPE_I_CANCELLED,
            uid: this.cs.user_session.id,
            quantity: el.quantity,
            remarks: el.io_remarks,
            action_done: 2,
            date: new Date()
          }
          return this.cs.postData({
            sourceid: 'listmgr',
            info: { tdata: values, query: 'inventory_orders', pdata: { id: 'id', value: '' } }
          })
        })
      )
      .subscribe(
        _ => {
          this.cs.openGrowl('', 'Status', 'Order cancelled successfully');
          this.reloadTable();
          // inform listings component to update UI
          this.triggerMarkReceived$.next();
        },
        err => {
          console.error(err);
        }
      )
  }

  triggerDateSearch() {
    this.updateUI();
    this.reloadTable();
  }

  printData() {
    // console.log('printData called');
    // print request
    this.printDataSub$ = this.printDataService.printContentSSR({
      title: this.pageTitle,
      contentType: ISContentTypes.TYPE_INVENTORY,
      user_name: this.cs.user_session.user_name,
      employee_id: this.cs.user_session.employee_id,
      fromDate: this.fromDate,
      toDate: this.toDate,
      reportType: this.inventoryReport
    })
      .subscribe(
        _ => { },
        err => {
          console.error(err);
        }
      )
  }

  ngAfterViewInit() {
    this.reloadTable();
  }

  reloadTable() {
    // $('#searchlist_table').DataTable().ajax.reload();
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.dtInstanceSub?.unsubscribe();
    this.fetchData1Sub$?.unsubscribe();
    this.fetchData2Sub$?.unsubscribe();
    this.procReqSub$?.unsubscribe();
    this.printDataSub$?.unsubscribe();
    this.dtTrigger.unsubscribe();
  }

}
