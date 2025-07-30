// services/GlobalMessageCounter.ts
export class GlobalMessageCounter {
  private counter: number = 0;

  getNextId(): number {
    return ++this.counter;
  }

  getCurrentId(): number {
    return this.counter;
  }
}
