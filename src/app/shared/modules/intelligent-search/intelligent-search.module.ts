import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { SearchIETMComponent } from './components/search-ietm/search-ietm.component';
import { SearchListingComponent } from './components/search-listing/search-listing.component';
import { DataTablesModule } from 'angular-datatables';
import { MomentModule } from 'ngx-moment';
import { SearchAddUpdComponent } from './components/search-add-upd/search-add-upd.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SearchDelComponent } from './components/search-del/search-del.component';
import { RouterModule } from '@angular/router';
import { SearchTableDataComponent } from './components/search-table-data/search-table-data.component';



@NgModule({
  declarations: [SearchIETMComponent, SearchListingComponent, SearchAddUpdComponent, SearchDelComponent, SearchTableDataComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDropdownModule,
    DataTablesModule,
    ModalModule,
    MomentModule,
    RouterModule
  ],
  exports: [SearchIETMComponent, SearchListingComponent, SearchAddUpdComponent]
})
export class IntelligentSearchModule { }
