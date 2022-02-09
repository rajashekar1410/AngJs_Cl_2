
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PagesComponent } from '../pages/pages.component';
import { etmcoreComponent } from './etmcore/etmcore.component';
import { TreeModule } from '@circlon/angular-tree-component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { ModalModule } from 'ngx-bootstrap/modal';
import { DataTablesModule } from 'angular-datatables';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { GlosaryComponent } from './glosary/glosary.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { CKEditorModule } from 'ng2-ckeditor';
import { WebviewDirective } from '../../core/directives/webview.directive';
import { MomentModule } from 'ngx-moment';
import { HyperlinkModule } from 'src/app/shared/modules/hyperlink/hyperlink.module';
import { WordExplainerModule } from 'src/app/shared/modules/word-explainer/word-explainer.module';
import { InventoryModule } from 'src/app/shared/modules/inventory/inventory.module';
import { InventoryListingComponent } from 'src/app/shared/modules/inventory/components/inventory-listing/inventory-listing.component';
import { LogsModule } from 'src/app/shared/modules/logs/logs.module';
import { LogsListingComponent } from 'src/app/shared/modules/logs/components/logs-listing/logs-listing.component';
import { IetmTableModule } from 'src/app/shared/modules/ietm-table/ietm-table.module';

export const routes: Routes = [

  {
    path: 'pagecmp/:modulettype/:category/:printview', component: PagesComponent,
    children: [
      { path: 'page/:pageid/:print', component: etmcoreComponent },
      { path: 'page/:pageid', component: etmcoreComponent },

    ]
  },
  {
    path: 'pagecmp/:moduletype/:category', component: PagesComponent,
    children: [
      { path: 'page/:pageid', component: etmcoreComponent, },
      { path: 'glosary/:pageid', component: GlosaryComponent },
      { path: 'inventory/:pageid', component: InventoryListingComponent },
      { path: 'logs/:pageid', component: LogsListingComponent }
    ]
  }

]
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    PipeModule,
    CKEditorModule,
    DataTablesModule,
    PdfJsViewerModule,
    TabsModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    BsDropdownModule.forRoot(),
    TreeModule,
    MomentModule,
    HyperlinkModule,
    WordExplainerModule,
    InventoryModule,
    LogsModule,
    IetmTableModule
  ],
  declarations: [
    PagesComponent,
    etmcoreComponent,
    WebviewDirective,
    GlosaryComponent,
    /* DummyComponent,*/
    /* IntroComponent,
      DashboardComponent,
    HomeComponent,
      DashboardComponent,
      UsersComponent,
      ManageannotationsComponent,
      PrintjobsComponent,
      ChangepasswordComponent,
      BackupmanagerComponent,
      UserhistoryComponent,
      AccessControlsComponent,
      ModulemanagerComponent*/
  ],
  entryComponents: []
})
export class pageModule { }
