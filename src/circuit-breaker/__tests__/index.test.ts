import { BreakerCommand, CircuitBreaker } from "../index";

const createMockCommand = (
  shouldTimeout: boolean
): BreakerCommand => (): Promise<any> =>
  shouldTimeout ? Promise.reject("failure") : Promise.resolve("success");

describe("Circuit breaker", () => {
  test("it should be able to define default breaker options", () => {
    const breaker = new CircuitBreaker();
    expect(breaker.isOpen()).toEqual(false);
  });

  test("it should be able to make request with default breaker options", async () => {
    const breaker = new CircuitBreaker();
    const mockCommand = createMockCommand(false);
    const response = await breaker.run(mockCommand);
    expect(response).toEqual("success");
  });

  test("it should open breaker after error threshold in default time frame", async () => {
    jest.useFakeTimers();
    const breaker = new CircuitBreaker();
    const mockCommandFailure = createMockCommand(true);
    await breaker.run(mockCommandFailure);
    jest.advanceTimersByTime(1000);
    await breaker.run(mockCommandFailure);

    expect(breaker.isOpen()).toEqual(true);

    jest.useRealTimers();
  });

  test.only("it should open breaker after error threshold in provided time frame", async () => {
    jest.useFakeTimers();
    const breaker = new CircuitBreaker({
      timeFrame: 2000
    });
    const mockCommandFailure = createMockCommand(true);
    await breaker.run(mockCommandFailure);
    jest.advanceTimersByTime(1900);
    expect(breaker.run(mockCommandFailure)).rejects.toThrowError(
      "[Breaker Open]"
    );
    jest.useRealTimers();
  });

  test("it should close breaker when breaker is HALF_OPEN", async () => {
    expect(true);
  });
});
