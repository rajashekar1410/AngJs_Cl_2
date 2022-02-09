import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelatedContentTypesAddUpdComponent } from './components/related-content-types-add-upd/related-content-types-add-upd.component';
import { RelatedContentTypesDelComponent } from './components/related-content-types-del/related-content-types-del.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RelatedContentTypesListingComponent } from './components/related-content-types-listing/related-content-types-listing.component';
import { IetmTableModule } from '../ietm-table/ietm-table.module';



@NgModule({
  declarations: [
    RelatedContentTypesAddUpdComponent,
    RelatedContentTypesDelComponent,
    RelatedContentTypesListingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IetmTableModule
  ]
})
export class RelatedContentTypeModule { }
