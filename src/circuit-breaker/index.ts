import debug from "debug";
const circuitBreakerDebug = debug("circuit-breaker");

export interface BreakerOptions {
  timeFrame?: number; // time duration in milliseconds
  errorThreshold?: number; // between 0 and 1 as a percentage
  timeout?: number; // timeout after which breaker should recheck if it can close
}

enum BreakerState {
  OPEN,
  CLOSED,
  HALF_OPEN
}

export type BreakerCommand = () => Promise<any>;

export class CircuitBreaker {
  private state: BreakerState;
  private errorCount: number = 0;
  private requestCount: number = 0;
  private command: BreakerCommand;

  constructor(private breakerOptions: BreakerOptions = {}) {
    this.breakerOptions.errorThreshold =
      this.breakerOptions.errorThreshold || 0.5;
    this.breakerOptions.timeFrame = this.breakerOptions.timeFrame || 1000;
    this.breakerOptions.timeout = this.breakerOptions.timeout || 2000;
    this.state = BreakerState.CLOSED;
  }

  async run(command: BreakerCommand) {
    this.command = command;
    this.requestCount += 1;
    switch (this.state) {
      case BreakerState.OPEN: {
        throw new Error("[Breaker Open]");
      }
      case BreakerState.CLOSED:
      default: {
        await this.execute();
        return;
      }
    }
  }

  isOpen() {
    return this.state !== BreakerState.CLOSED;
  }

  private async execute() {
    try {
      const response = await this.command();
      if (this.state !== BreakerState.OPEN) {
        this.close();
      }
      return response;
    } catch (err) {
      this.errorCount += 1;
      this.checkBreaker();
    }
  }

  private checkBreaker() {
    if (this.getPercentageError() > this.breakerOptions.errorThreshold) {
      this.open();
    }
  }

  private getPercentageError() {
    return this.errorCount / this.requestCount;
  }

  private open() {
    circuitBreakerDebug("Breaker opened");
    this.state = BreakerState.OPEN;

    // Set a timer to reset to HALF OPEN
    // setTimeout(() => this.state = BreakerState.HALF_OPEN, this.breakerOptions.timeout)
    const poller = setTimeout(() => {
      this.command()
        .then(() => this.close())
        .catch(() => {
          circuitBreakerDebug("Error in re-connecting to service");
          this.open();
        });
    }, this.breakerOptions.timeout);

    poller.unref();
  }

  private close() {
    circuitBreakerDebug("Breaker closed");
    this.state = BreakerState.CLOSED;
    // Reset error and request
    this.errorCount = 0;
    this.requestCount = 0;
  }
}
