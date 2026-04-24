import EventEmitter from "events";

class EventBus extends EventEmitter {
  constructor() {
    super();

    // prevent memory leak warnings
    this.setMaxListeners(50);
  }

  emitEvent(event: string, payload?: any) {
    this.emit(event, payload);
  }

  onEvent(event: string, listener: (...args: any[]) => void) {
    this.on(event, listener);
  }

  onceEvent(event: string, listener: (...args: any[]) => void) {
    this.once(event, listener);
  }

  offEvent(event: string, listener: (...args: any[]) => void) {
    this.off(event, listener);
  }
}

export const eventBus = new EventBus();