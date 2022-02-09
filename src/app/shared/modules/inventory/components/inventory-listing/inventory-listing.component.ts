import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { IetmModalService } from 'src/app/core/services/ietm-modal/ietm-modal.service';
import { PrintDataTypes } from '../../../print-data/models/print-data-type';
import { PrintDataService } from '../../../print-data/services/print-data.service';
import { InventoryActionTypes, InventoryReportTypes } from '../../models/inventory-tracking';
import { InventoryService } from '../../services/inventory/inventory.service';
import { InventoryAddUpdComponent } from '../inventory-add-upd/inventory-add-upd.component';
import { InventoryDelComponent } from '../inventory-del/inventory-del.component';
import { InventoryMarkConsumedComponent } from '../inventory-mark-consumed/inventory-mark-consumed.component';
import { InventoryReportsComponent } from '../inventory-reports/inventory-reports.component';
import { InventoryReqMoreItemsComponent } from '../inventory-req-more-items/inventory-req-more-items.component';

@Component({
  selector: 'app-inventory-listing',
  templateUrl: './inventory-listing.component.html',
  styleUrls: ['./inventory-listing.component.scss']
})
export class InventoryListingComponent implements OnInit, OnDestroy {

  constructor(
    public cs: CommonService,
    private http: HttpClient,
    private mdls: IetmModalService,
    private invS: InventoryService,
    private printDataService: PrintDataService,
    private modalS: BsModalService
  ) { }

  contentList: any[] = []
  dtOptions: DataTables.Settings = {}
  dtFilters = {};
  dtTrigger = new Subject();

  tbl_start = 0;

  invTypesArray = [];
  selectedInvType = {
    id: -1,
    name: 'All'
  };
  fetchInvTypesSub$: Subscription = null;

  dataSub$: Subscription = null;

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;

  printDataSub$: Subscription = null;

  inventoryActionTypes = InventoryActionTypes;
  inventoryReportTypes = InventoryReportTypes;

  ngOnInit(): void {
    // update UI
    this.cs.emitChange('1');
    this.cs.page_header = 'Inventory';
    // DT
    this.initDTOptions();

    // filters
    this.invTypesArray.push({
      id: -1,
      name: 'All'
    });
    this.fetchInvTypes();
  }

  fetchInvTypes() {
    this.fetchInvTypesSub$ = this.invS.fetchInvTypes()
      .subscribe(
        (data: any) => {
          if (data.status == 1) {
            data?.response?.forEach(el => {
              this.invTypesArray.push(el);
            });
            // set default value
            this.changeInvType(-1);
          }
        },
        err => {
          console.error(err);
        }
      );
  }

  changeInvType(id: number) {
    this.selectedInvType = this.invTypesArray.find(el => el.id == id);
    if (id == -1) {
      this.dtFilters['1'] = '1';
      delete this.dtFilters['inv_type_id'];
    } else {
      this.dtFilters['inv_type_id'] = `${id}`;
    }
    this.reloadTable();
  }

  initDTOptions() {
    const self = this;
    this.dtOptions = {
      language: { search: "Find:", searchPlaceholder: 'By: Part No, Description, UoM or Remarks', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: true, searching: true, searchDelay: 850, destroy: true,
      lengthChange: true, order: [1, 'desc'], scrollY: "calc(100vh - 340px)", "scrollX": true, scrollCollapse: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "inventory_view";
        dataTablesParameters['dtfilters'] = this.dtFilters;
        dataTablesParameters['searchquery'] = " and (part_no like '%" + dataTablesParameters['search']['value'] + "%' or description like '%" + dataTablesParameters['search']['value'] + "%' or remarks like '%" + dataTablesParameters['search']['value'] + "%' or uom like '%" + dataTablesParameters['search']['value'] + "%') ";
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        //alert("/////");
        this.tbl_start = dataTablesParameters['start'];
        self.dataSub$ = self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            // console.log(JSON.stringify(resp));
            //    console.log(".........................................");
            if (resp['status'] == 1) {

              // this.userscount=resp.recordsTotal+1;
              callback({
                recordsTotal: resp.recordsTotal,
                recordsFiltered: resp.recordsFiltered,
                data: resp.data
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
      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'id',
          title: 'Sr. No',
          orderable: false,
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'part_no', title: 'Part Number' },
        { data: 'description', title: 'Description' },
        { data: 'inv_type_name', title: 'Inventory Type' },
        { data: 'total', title: 'Total Qty' },
        { data: 'uom', title: 'UoM' },
        { data: 'consumed', title: 'Consumed' },
        { data: 'available', title: 'Available' },
        { data: 'remarks', title: 'Remarks' },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '8%',
          createdCell: (cell) => {
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
                  { title: "View History", cmd: "viewhistry", uiIcon: "ui-icon-comment", disabled: self.cs.user_session.user_type < 1 },
                  { title: "Update Consumed", cmd: "updtcnsmd", uiIcon: "ui-icon-pencil", disabled: self.cs.user_session.user_type < 1 },
                  { title: "Request More Quantity", cmd: "rqstqnt", uiIcon: "ui-icon-refresh", disabled: self.cs.user_session.user_type < 1 },
                  { title: "Edit Inventory", cmd: "edit", uiIcon: "ui-icon-pencil", disabled: self.cs.user_session.user_type != 1 },
                  { title: "Delete", cmd: "delete", uiIcon: "ui-icon-trash", disabled: self.cs.user_session.user_type != 1 },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    const cellItem = $(ui.target).closest('td');
                    const row: any = $("#tbllistid").DataTable().row(cellItem).data();


                    // console.log(itemIndex);
                    if (ui.cmd == 'edit') {
                      // that.editform(that.editmember, rowId, itemIndex);
                      self.triggerAddUpdInv(self.inventoryActionTypes.TYPE_I_EDIT, row.id)
                    } else if (ui.cmd == 'delete') {
                      // that.opendelconf(rowId, that.deletbkms);
                      self.triggerDelInv(row)
                    } else if (ui.cmd == 'rqstqnt') {
                      // that.opendelconf(rowId, that.deletbkms);
                      self.triggerReqMoreItems(row)
                    } else if (ui.cmd == 'updtcnsmd') {
                      // that.opendelconf(rowId, that.deletbkms);
                      self.triggerMarkConsumed(row)
                    }
                    else if (ui.cmd == 'viewhistry') {
                      // that.opendelconf(rowId, that.deletbkms);
                      self.triggerInvReports(row, self.inventoryReportTypes.TYPE_ITEM_HISTORY)
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

        { data: 'inv_type_id', visible: false },
      ],
      columnDefs: [
        { orderable: false, targets: [0, 9] },
        { targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], visible: true },
        { targets: '_all', visible: false }
      ],
      drawCallback: () => {
        // needed as TOC hides with transition and columns go bizare
        setTimeout(() => {
          this.dtElement?.dtInstance?.then(i => i.columns.adjust());
        }, 300);
      }
    };
  }

  triggerAddUpdInv(isEditMode: InventoryActionTypes, module_id?: string) {
    const ref = this.mdls.openmdl(InventoryAddUpdComponent);
    ref.setClass('modal-md ' + this.cs.default_theme);
    const content = ref.content as InventoryAddUpdComponent;
    content.updateUI(isEditMode, module_id);
    const sub = content.triggerInvAddUpd$.subscribe(status => {
      const msg = [InventoryActionTypes.TYPE_I_EDIT].includes(isEditMode) ? 'Updated' : 'Added';
      if (status == 1) {
        this.reloadTable()
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Inventory ${msg} successfully`);
      } else {
        this.cs.openGrowl('', 'Status', `Inventory ${msg} failed.`);
      }
    });
  }

  triggerDelInv(inv) {
    const ref = this.mdls.openmdl(InventoryDelComponent);
    this.cs.popdragabale();
    // Set inv info
    const content = ref.content as InventoryDelComponent;
    content.invInfo = inv;
    // Listen to delete finished event
    const sub = content.triggerDel$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Inventory item Deleted successfully');
      } else {
        this.cs.openGrowl('', 'Status', 'Inventory item Deletion failed.');
      }
    });
  }

  triggerInvReports(inv, invReport: InventoryReportTypes) {
    const ref = this.modalS.show(InventoryReportsComponent, {
      initialState: {
        invInfo: inv,
        inventoryReport: invReport,
      },
    });
    ref.setClass("modal-lg " + this.cs.default_theme);
    /**
     * When opening "Open Orders", user may mark order as received.
     * this will update `total` column of respective inventory item
     * Hence, we need to reload listing table
     */
    if (invReport == this.inventoryReportTypes.TYPE_CURRENT_ORDERS) {
      const content = ref.content as InventoryReportsComponent;
      const sub = content.triggerMarkReceived$.subscribe(_ => {
        this.reloadTable();
        sub.unsubscribe();
      })
    }
    this.cs.popdragabale();
  }

  triggerMarkConsumed(inv) {
    const ref = this.modalS.show(InventoryMarkConsumedComponent, {
      class: this.cs.default_theme,
      initialState: {
        invInfo: inv
      }
    });
    this.cs.popdragabale();
    // Set inv info
    const content = ref.content as InventoryMarkConsumedComponent;
    content.invInfo = inv;
    const sub = content.triggerMarkConsumed$.subscribe(status => {
      if (status == 1) {
        this.reloadTable();
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Inventory consumed successfully');
      } else {
        this.cs.openGrowl('', 'Status', 'Inventory request failed.');
      }
    });
  }

  triggerReqMoreItems(inv) {
    const ref = this.modalS.show(InventoryReqMoreItemsComponent, {
      class: this.cs.default_theme,
      initialState: {
        invInfo: inv
      }
    });
    this.cs.popdragabale();
    // Set inv info
    const content = ref.content as InventoryReqMoreItemsComponent;
    content.invInfo = inv;
    // Listen to delete finished event
    const sub = content.triggerReqMoreItems$.subscribe(status => {
      if (status == 1) {
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', 'Inventory request placed successfully');
      } else {
        this.cs.openGrowl('', 'Status', 'Inventory request failed.');
      }
    });
  }

  reloadTable() {
    // $('#tbllistid').DataTable().ajax.reload();
    this.dtTrigger.next();
  }

  printData() {
    // console.log('printData called');
    // hide last column + rows of table
    const thSelector = `.table thead th:last-child`;
    const tbSelector = `.table tbody td:last-child`;
    $(thSelector).hide();
    $(tbSelector).hide();
    // print request
    const headers = $(`.table thead`).html();
    const tbody = $(`.table tbody`).html();
    this.printDataSub$ = this.printDataService.printContent({
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

  ngOnDestroy() {
    this.dataSub$?.unsubscribe();
    this.fetchInvTypesSub$?.unsubscribe();
    this.printDataSub$?.unsubscribe();
    this.dtTrigger.unsubscribe();
  }

}
