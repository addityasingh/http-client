import { Job, Stack } from "./stack";
import { EventEmitter } from "events";

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

class JobStackFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobStackFullError";
  }
}

interface StackOptions {
  MaxConcurrency: number;
  Timeout: number; // in ms
  MaxJobs: number; // Not sure if this is needed together with MaxConcurrency
}

const POLLER_TIME = 10;

class DoneEventEmitter extends EventEmitter {}

class RequestEventEmitter extends EventEmitter {}

class ErrorEventEmitter extends EventEmitter {}

export class JobStack {
  private stack: Stack;
  private done: DoneEventEmitter;
  private request: RequestEventEmitter;
  private timer: NodeJS.Timer;

  constructor(private options?: StackOptions) {
    // TODO: The concurrency is not yet implemented. Implement using pool mechanism
    this.options.MaxConcurrency = this.options.MaxConcurrency || 1;
    this.options.MaxJobs = this.options.MaxJobs || 1;
    this.options.Timeout = this.options.Timeout || 1000;
    this.done = new DoneEventEmitter();
    this.timer = null;

    this.stack = new Stack(this.options.MaxJobs);
    this.run();
  }

  private run() {
    this.timer = setInterval(async () => {
      const oldest = this.stack.getBottom();
      let timeout = oldest.timeout;

      // Handle incoming requests
      this.request.on("request", (job: Job) => {
        if (this.stack.isFull()) {
          const oldest = this.stack.shift();
          oldest.notify.emit("error", new JobStackFullError("Job stack full"));
        }

        this.stack.push(job);
      });

      // Handle completion of jobs
      this.done.on("done", () => {
        if (!this.stack.isEmpty()) {
          const job = this.stack.pop();
          // Emit this event for clarity, but no listener is registered for this
          job.notify.emit("success");
        }
      });

      // Handle timeout and remove the oldest job with throwing Timeout error
      setTimeout(() => {
        oldest.notify.emit("error", new TimeoutError("Job timed out"));
        this.stack.shift();
      }, timeout);
    }, POLLER_TIME);

    this.timer.unref();
  }

  /**
   * Flush and stop the job processing
   */
  flush() {
    clearInterval(this.timer);
    this.timer = null;
  }

  newJob(): Job {
    return {
      notify: new ErrorEventEmitter(),
      timeout: this.options.Timeout
    };
  }

  async wait() {
    const job = this.newJob();
    this.request.emit("request", job);

    const errorChannel = new Promise(resolve => {
      job.notify.on("error", err => {
        resolve(err);
      });
    });

    return {
      done: () => {
        this.done.emit("done");
      },
      err: await errorChannel
    };
  }

  async execute(job: () => {}): Promise<{} | Error> {
    const { done, err } = await this.wait();
    if (err != null) {
      job();
      done();
      return null;
    } else {
      return err;
    }
  }
}
