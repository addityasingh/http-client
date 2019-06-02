import * as http from "http";
import * as https from "https";
import { parse } from "url";

import getTimings, { HttpTimestamp, HttpTiming } from './timings';

class HttpError extends Error {
  code: string;
}

interface TimedResponse {
  timings: HttpTiming;
  body: any;
}

interface TimedRequestOptions extends https.RequestOptions {
  url: string,
  timeout?: number;
}

export default function clientWithTimings(
  options: TimedRequestOptions,
  callback: (err: HttpError, res: TimedResponse) => any,
): void {
  const timings: HttpTimestamp = {
    startTimestamp: process.hrtime(),
    dnsLookupTimestamp: undefined,
    tcpConnectionTimestamp: undefined,
    tlsHandshakeTimestamp: undefined,
    responseBodyStartTimestamp: undefined,
    responseBodyEndTimestamp: undefined
  };
  const requestOptions = Object.assign({}, parse(options.url), options);
  const { protocol, timeout = 2000 } = requestOptions;
  const usedProtocol = protocol === "https:" ? https : http;

  let response = "";
  const request = usedProtocol
    .request(requestOptions, res => {
      res.once("data", () => {
        timings.responseBodyStartTimestamp = process.hrtime();
      });

      res.on("data", chunk => (response += chunk));
      res.on("end", () => {
        timings.responseBodyEndTimestamp = process.hrtime();
        callback(null, {
          body: response,
          timings: getTimings(timings)
        });
      });
    })
    .setTimeout(timeout)
    .on("error", callback);

  request.on("socket", socket => {
    // Socket created for dnslookup
    socket.on("lookup", () => {
      timings.dnsLookupTimestamp = process.hrtime();
    });

    // TCP Connection established
    socket.on("connect", () => {
      timings.tcpConnectionTimestamp = process.hrtime();
    });

    // TLS Handshake complete
    socket.on("secureConnect", () => {
      timings.tlsHandshakeTimestamp = process.hrtime();
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