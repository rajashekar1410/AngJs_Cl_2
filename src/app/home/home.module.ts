
import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from '../home/home.component';

import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { ManageannotationsComponent } from './manageannotations/manageannotations.component';

import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { BackupmanagerComponent } from './backupmanager/backupmanager.component';

import { ModulemanagerComponent } from './modulemanager/modulemanager.component';
import { PagemanagerComponent } from './pagemanager/pagemanager.component';
import { PipeModule } from 'src/app/pipes/pipe.module';
import { ManagebookmarksComponent } from './managebookmarks/managebookmarks.component';
import { FilemanagerComponent } from './filemanager/filemanager.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { DataTablesModule } from 'angular-datatables';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { ChangeLogComponent } from "./changelog/changelog.component";
import { WordsexplainerComponent } from "./wordsexplainer/wordsexplainer.component";
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { MomentModule } from 'ngx-moment';
import { CKEditorModule } from 'ng2-ckeditor';
import { UpdatesecurityquestionsComponent } from './updatesecurityquestions/updatesecurityquestions.component';
import { LoginAuthService } from 'src/app/core/services/login-auth/login-auth.service';
import { WordExplainerModule } from '../shared/modules/word-explainer/word-explainer.module';
import { ModuleManagerModule } from '../shared/modules/module-manager/module-manager.module';
import { ModuleListingComponent } from '../shared/modules/module-manager/components/module-listing/module-listing.component';
import { TrackingListingComponent } from '../shared/modules/user-tracking/components/tracking-listing/tracking-listing.component';
import { UserTrackingModule } from '../shared/modules/user-tracking/user-tracking.module';
import { UserLoginsListingComponent } from '../shared/modules/user-tracking/components/user-logins-listing/user-logins-listing.component';
import { SearchIETMComponent } from '../shared/modules/intelligent-search/components/search-ietm/search-ietm.component';
import { IntelligentSearchModule } from '../shared/modules/intelligent-search/intelligent-search.module';
import { SearchListingComponent } from '../shared/modules/intelligent-search/components/search-listing/search-listing.component';
import { PrintDataModule } from '../shared/modules/print-data/print-data.module';
import { InventoryTypesListingsComponent } from '../shared/modules/inventory/components/inventory-types-listings/inventory-types-listings.component';
import { InventoryModule } from '../shared/modules/inventory/inventory.module';
import { LogoutModalComponent } from './logout-modal/logout-modal.component';
import { IetmTableModule } from '../shared/modules/ietm-table/ietm-table.module';
import { RelatedContentTypeModule } from '../shared/modules/related-content-types/related-content-type.module'
import { RelatedContentTypesListingComponent } from '../shared/modules/related-content-types/components/related-content-types-listing/related-content-types-listing.component';
import { CategoryManagerModule } from '../shared/modules/category-manager/category-manager.module';
import { CategoryListingComponent } from '../shared/modules/category-manager/components/category-listing/category-listing.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from '../core/injectables/http.interceptor';
export const routes: Routes = [
  {
    path: '', component: HomeComponent,
    children: [
      { path: '', component: DashboardComponent, pathMatch: 'full', canActivate: [LoginAuthService] },
      { path: 'globalsearch', component: SearchIETMComponent, canActivate: [LoginAuthService] },
      { path: 'si', component: SearchListingComponent, canActivate: [LoginAuthService] },
      { path: 'dashboard', component: DashboardComponent, canActivate: [LoginAuthService] },
      { path: 'managemodules', component: ModuleListingComponent, canActivate: [LoginAuthService] },
      { path: 'managecategory', component: CategoryListingComponent, canActivate: [LoginAuthService] },
      { path: 'users', component: UsersComponent, canActivate: [LoginAuthService] },
      { path: 'ul', component: UserLoginsListingComponent, canActivate: [LoginAuthService] },
      { path: 'useractivity', component: TrackingListingComponent, canActivate: [LoginAuthService] },
      { path: 'manageannotations', component: ManageannotationsComponent, canActivate: [LoginAuthService] },
      { path: 'changepassword', component: ChangepasswordComponent, canActivate: [LoginAuthService] },
      { path: 'updatesecurityquestions', component: UpdatesecurityquestionsComponent, canActivate: [LoginAuthService] },
      { path: 'updatesecurityquestions/:id', component: UpdatesecurityquestionsComponent, canActivate: [LoginAuthService] },
      { path: 'backupmanager', component: BackupmanagerComponent, canActivate: [LoginAuthService] },
      { path: 'modulemanager', component: ModulemanagerComponent, data: { shouldReuse: false, key: 'apimarketroot' }, canActivate: [LoginAuthService] },
      { path: 'pagemanager', component: PagemanagerComponent, canActivate: [LoginAuthService] },
      { path: 'pages', loadChildren: () => import('../../app/home/pages/pages.module').then(m => m.pageModule), canActivate: [LoginAuthService] },
      { path: 'managebookmarks', component: ManagebookmarksComponent, canActivate: [LoginAuthService] },
      { path: 'filemanager', component: FilemanagerComponent, canActivate: [LoginAuthService] },
      { path: 'changelog', component: ChangeLogComponent, canActivate: [LoginAuthService] },
      { path: 'wordsexplainer', component: WordsexplainerComponent, canActivate: [LoginAuthService] },
      { path: 'inv_type', component: InventoryTypesListingsComponent, canActivate: [LoginAuthService] },
      { path: 'rel_type', component: RelatedContentTypesListingComponent, canActivate: [LoginAuthService] },
    ]
  }


]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    CKEditorModule,
    ReactiveFormsModule,
    DataTablesModule,
    MomentModule,
    PdfJsViewerModule,
    BsDatepickerModule.forRoot(),
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    PipeModule.forRoot(),
    WordExplainerModule,
    ModuleManagerModule,
    UserTrackingModule,
    IntelligentSearchModule,
    PrintDataModule,
    InventoryModule,
    IetmTableModule,
    RelatedContentTypeModule,
    CategoryManagerModule

  ],
  declarations: [
    DashboardComponent,
    HomeComponent,
    UsersComponent,
    ManageannotationsComponent,
    ChangepasswordComponent,
    BackupmanagerComponent,
    ModulemanagerComponent,
    PagemanagerComponent,
    ManagebookmarksComponent,
    FilemanagerComponent,
    ChangeLogComponent,
    WordsexplainerComponent,
    UpdatesecurityquestionsComponent,
    LogoutModalComponent
  ],
  entryComponents: [],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ]
})
export class homeModule { }
