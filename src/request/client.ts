import * as http from "http";
import * as https from "https";
import getTimings, { HttpTiming } from './timings';

class HttpError extends Error {
  code: string;
}

interface TimedResponse {
  timings: any;
  body: any;
}

interface TimedRequestOptions extends https.RequestOptions {
  timeout: number;
}

export default function clientWithTimings(
  options: TimedRequestOptions,
  callback: (err: HttpError, res: TimedResponse) => any
) {
  const timings: HttpTiming = {
    startTime: process.hrtime(),
    dnsLookupTime: undefined,
    tcpConnectionTime: undefined,
    tlsHandshakeTime: undefined,
    responseBodyStartTime: undefined,
    responseBodyEndTime: undefined
  };
  const { protocol } = options;
  const usedProtocol = protocol === "https:" ? https : http;

  let response = "";
  const request = usedProtocol
    .request(options, res => {
      res.once("data", () => {
        timings.responseBodyStartTime = process.hrtime();
      });

      res.on("data", chunk => (response += chunk));
      res.on("end", () => {
        timings.responseBodyEndTime = process.hrtime();
        callback(null, {
          body: response,
          timings: getTimings(timings)
        });
      });
    })
    .setTimeout(options.timeout)
    .on("error", callback);

  request.on("socket", socket => {
    // Socket created for dnslookup
    socket.on("lookup", () => {
      timings.dnsLookupTime = process.hrtime();
    });

    // TCP Connection established
    socket.on("connect", () => {
      timings.tcpConnectionTime = process.hrtime();
    });

    // TLS Handshake complete
    socket.on("secureConnect", () => {
      timings.tlsHandshakeTime = process.hrtime();
    });
    socket.on("timeout", () => {
      // Drop request on timeout
      request.abort();
      const err = new HttpError("ETIMEDOUT");
      err.code = "ETIMEDOUT";
      callback(err, null);
    });
  });

  request.end();
}