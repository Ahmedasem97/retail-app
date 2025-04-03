import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  logedSave: WritableSignal<string > = signal("")

  
  getLogedValue() {
    return this.logedSave();
  }

  setLogedValue(value: string) {
    this.logedSave.set(value);
  }
}
