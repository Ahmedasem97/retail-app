import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorMessageComponent } from "../../../shared/components/error-message/error-message.component";
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { admin } from '../../enums/enums';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ErrorMessageComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup
  errorMessage!: boolean

  private readonly _formBuilder = inject(FormBuilder)
  private readonly _router = inject(Router)
  private readonly _authService = inject(AuthService)

  ngOnInit(): void {
    this.initLoginForm()
  }

  initLoginForm() {
    this.loginForm = this._formBuilder.group({
      username: [null, [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/), Validators.minLength(4), Validators.maxLength(20)]],
      password: [null, [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/), Validators.minLength(4), Validators.maxLength(20)]]
    })
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm.value.username == "admin" && this.loginForm.value.password == "admin") {
      this._authService.setLogedValue("loged")
      localStorage.setItem("retailToken", this._authService.getLogedValue())
      
      this._router.navigate(["main/home"])
      this.errorMessage = false
    }
    else {
      this.errorMessage = true

    }
  }

  admin(userInput: HTMLInputElement, passInput: HTMLInputElement) {
    userInput.value = admin.admin
    passInput.value = admin.admin
    userInput.dispatchEvent(new Event('input', { bubbles: true }));
    passInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
