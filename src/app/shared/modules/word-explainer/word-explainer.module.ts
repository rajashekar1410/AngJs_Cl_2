import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordExplainerModalComponent } from './components/word-explainer-modal/word-explainer-modal.component';
import { WordExplainerDelComponent } from './components/word-explainer-del/word-explainer-del.component';
import { WordExplainerPreviewComponent } from './components/word-explainer-preview/word-explainer-preview.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from 'ng2-ckeditor';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PipeModule } from 'src/app/pipes/pipe.module';



@NgModule({
  declarations: [
    WordExplainerModalComponent,
    WordExplainerDelComponent,
    WordExplainerPreviewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CKEditorModule,
    ModalModule.forRoot(),
    PipeModule.forRoot()
  ],
  exports: [
    WordExplainerModalComponent,
    WordExplainerDelComponent,
    WordExplainerPreviewComponent
  ]
})
export class WordExplainerModule {
  static forRoot(): ModuleWithProviders<WordExplainerModule> {
    return {
        ngModule: WordExplainerModule,
        providers: [],
    };
}
}
