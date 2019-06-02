import { Job, Stack } from "./stack";

/**
 * How to create a job queue?
 * 1. Create a Job interface which looks as below
 *  // { executor: () => any; timeout: number }
 * 2. Create a stack to hold all the jobs
 * 3. Create a StackOption to configure the queue
 *  // { MaxConcurrency: number, MaxTimeout: number, MaxJobs: number}
 * 4. Poll and keep executing the jobs
 * 5. Find if the last job on the queue(bottom of stack) should timeout
 * 5.a Throw TimeoutError
 * 5.b Remove the job to free space
 * 6. If the job stack is full
 * 6.a Throw JobStackFullError
 * 6.b Remove the job to free space
 */

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

const POLLER_TIME = 100;

class JobStack {
  private stack: Stack;
  constructor(private options?: StackOptions) {
    this.options.MaxConcurrency = this.options.MaxConcurrency || 1;
    this.options.MaxJobs = this.options.MaxJobs || 1;
    this.options.Timeout = this.options.Timeout || 1000;

    this.stack = new Stack(this.options.MaxJobs);
    this.run();
  }

  private run() {
    const poller = setInterval(() => {}, POLLER_TIME);

    poller.unref();
  }

  execute(job: Job) {}
}
