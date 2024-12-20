import { Session } from "./game";

export const SESSIONS: Session[] = [];
export const OBSERVABLES: Observable[] = [];
export class Observable {
  observers: ((data: any) => void)[];
  
  constructor() {
    this.observers = [];
  }

  subscribe(func: (data: any) => void) {
    this.observers.push(func);
  }

  unsubscribe(func: (data: any) => void) {
    this.observers = this.observers.filter((observer) => observer !== func);
  }

  notify(data: Session) {
    this.observers.forEach((observer) => observer(data));
  }
}
