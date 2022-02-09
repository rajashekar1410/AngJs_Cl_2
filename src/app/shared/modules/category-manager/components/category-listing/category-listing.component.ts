import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/core/services/common/common.service';
import { CategoryUpdComponent } from '../category-upd/category-upd.component';

@Component({
  selector: 'app-category-listing',
  templateUrl: './category-listing.component.html',
  styleUrls: ['./category-listing.component.scss']
})
export class CategoryListingComponent implements OnInit, AfterViewInit, OnDestroy {

  dtOptions: ADTSettings = {}
  dtTrigger = new Subject();
  dtFilters = {};
  tbl_start = 0;

  constructor(
    private cs: CommonService,
    private http: HttpClient,
    private bsModalS: BsModalService
  ) { }

  ngOnInit(): void {
    // Enable page nav buttons
    this.cs.emitChange('1');
    // Page title
    this.cs.page_header = 'Manage IETM Categories';
    // table init
    this.initDTOptions();
  }

  initDTOptions() {
    const self = this;
    this.dtOptions = {
      "language": { search: "Find:", searchPlaceholder: 'By: Category Name', emptyTable: 'No records found' },
      pageLength: 10, serverSide: true, processing: false, searching: true,
      lengthChange: true, "order": [2, 'asc'], scrollY: "calc(100vh - 320px)", "scrollX": true, scrollCollapse: true, destroy: true,
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters['query_tbl'] = "pagecategories";
        dataTablesParameters['dtfilters'] = self.dtFilters;
        dataTablesParameters['searchquery'] = " where name like '%" + dataTablesParameters['search']['value'] + "%' "
        // console.log("================"+dataTablesParameters['searchquery']+"==================");
        this.tbl_start = dataTablesParameters['start'];
        self.http.post<{ data: any[]; draw: number; recordsFiltered: number; recordsTotal: number; }>(
          this.cs.apiUrl + "dtl_listings", dataTablesParameters, {}).subscribe(resp => {
            //  alert(JSON.strinfigy(resp));
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: resp.data
            });
          }, console.error);
      },

      // note: column order in this array affects table sort in server
      columns: [
        {
          data: 'index',
          title: 'Sr. No',
          orderable: false,
          width: '8%',
          render: (_, __, ___, meta) => this.tbl_start + meta.row + 1
        },
        { data: 'id', title: 'ID No.', width: '8%' },
        { data: 'item_order', title: 'Category Position', width: '5%' },
        { data: 'name', title: 'Category Name' },
        {
          data: 'admin_rights',
          title: 'Visible for Administrators',
          orderable: false,
          render: (val) => val == 0 ? 'No' : 'Yes'
        },
        {
          data: 'maintainer_rights',
          title: 'Visible for Maintainers',
          orderable: false,
          render: (val) => val == 0 ? 'No' : 'Yes'
        },
        {
          data: 'operator_rights',
          title: 'Visible for Operators',
          orderable: false,
          render: (val) => val == 0 ? 'No' : 'Yes'
        },
        {
          data: '1',
          title: 'Actions',
          orderable: false,
          width: '8%',
          visible: self.cs.user_session.user_type == 0,
          createdCell: (cell, _, row) => {
            if (self.cs.user_session.user_type != 0) return;
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

                  { title: "Edit Category", cmd: "edit", uiIcon: "ui-icon-pencil" },
                ],
                preventContextMenuForPopup: true,
                select: function (_event: never, ui: { target: JQuery<HTMLElement>, cmd: string }) {
                  try {
                    if (ui.cmd == 'edit') {
                      self.triggerEditCategory(row.id)
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

  triggerEditCategory(category_id: number) {
    const ref = this.bsModalS.show(CategoryUpdComponent, { class: this.cs.default_theme });
    this.cs.popdragabale();
    const content = ref.content as CategoryUpdComponent;
    const isEditMode = true; // hard-coded
    content.updateUI(isEditMode, category_id.toString());
    const sub = content.triggerCategoryAddUpd$.subscribe(status => {
      if (status == 1) {
        const msg = isEditMode ? 'Edited' : 'Added';
        this.reloadTable()
        // Clean up
        sub.unsubscribe();
        ref.hide();
        this.cs.openGrowl('', 'Status', `Category ${msg} successfully`);
        // fetch new data
        this.cs.refreshCategoryData();
      } else {
        this.cs.openGrowl('', 'Status', `Category ${isEditMode ? 'Edit' : 'Add'} failed.`);
      }
    });
  }

  ngAfterViewInit() {
    this.reloadTable();
  }

  reloadTable() {
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    this.dtTrigger?.unsubscribe();
  }

}
