import * as nock from "nock";
import clientWithTimings from "../index";

describe.only("http-client with timer", () => {
  test("should be able to make http request to remote http server", async () => {
    nock("http://api.github.com")
      .get("/")
      .reply(200, {
        key: "value"
      });

    clientWithTimings(
      {
        url: "https://api.github.com"
      },
      (_, res) => {
        expect(res.timings).toBeInstanceOf(Object);
        expect(res.body).toEqual(JSON.stringify({ key: "value" }));
      }
    );
  });

  test("should be able to make https request to remote http server", async () => {
    nock("https://api.github.com")
      .get("/")
      .reply(200, {
        key: "value"
      });

    clientWithTimings(
      {
        url: "https://api.github.com"
      },
      (_, res) => {
        expect(res.timings).toBeInstanceOf(Object);
        expect(res.body).toEqual(JSON.stringify({ key: "value" }));
      }
    );
  });

  test("should be able to return timings for http request response lifecycle", async () => {
    nock("https://api.github.com")
      .get("/")
      .reply(200, {
        key: "value"
      });

    clientWithTimings(
      {
        url: "https://api.github.com"
      },
      (_, res) => {
        expect(res.timings).toBeInstanceOf(Object);
        expect(res.timings.dnsLookup).not.toBeDefined();
        expect(res.timings.tcpConnectionTime).toBeDefined();
        expect(res.timings.tlsHandshakeTime).toBeDefined();
        expect(res.timings.firstByte).toBeDefined();
        expect(res.timings.contentTransfer).toBeDefined();
        expect(res.timings.total).toBeDefined();
      }
    );
  });
});
