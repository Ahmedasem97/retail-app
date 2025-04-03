import { Component, Input } from '@angular/core';
import { ErrorMessage } from '../../../core/interfaces/error-message.interface';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-error-message',
  imports: [],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.css'
})
export class ErrorMessageComponent {
  @Input({required:true}) errorText!:ErrorMessage[] 
  @Input({required:true}) formGroupErr!:FormGroup 
  @Input({required:true}) formControlErr!:string 
}
