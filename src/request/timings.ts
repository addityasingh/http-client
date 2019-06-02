type HighResolutionTimestamp = [number, number];

export interface HttpTimestamp {
  startTimestamp: HighResolutionTimestamp;
  dnsLookupTimestamp: HighResolutionTimestamp;
  tcpConnectionTimestamp: HighResolutionTimestamp;
  tlsHandshakeTimestamp: HighResolutionTimestamp;
  responseBodyStartTimestamp: HighResolutionTimestamp;
  responseBodyEndTimestamp: HighResolutionTimestamp;
}

export interface HttpTiming {
  dnsLookup: number;
  tcpConnectionTime: number;
  tlsHandshakeTime: number;
  firstByte: number;
  contentTransfer: number;
  total: number;
}

export default function getTimings(httpTimings: HttpTimestamp): HttpTiming {
  const dnsLookup = httpTimings.dnsLookupTimestamp
    ? findDuration(httpTimings.startTimestamp, httpTimings.dnsLookupTimestamp)
    : undefined;
  const tcpConnectionTime = httpTimings.tcpConnectionTimestamp
    ? findDuration(
        httpTimings.dnsLookupTimestamp || httpTimings.startTimestamp,
        httpTimings.tcpConnectionTimestamp
      )
    : undefined;
  const tlsHandshakeTime = httpTimings.tlsHandshakeTimestamp
    ? findDuration(
        httpTimings.tcpConnectionTimestamp,
        httpTimings.tlsHandshakeTimestamp
      )
    : undefined;
  const firstByte = findDuration(
    httpTimings.tlsHandshakeTimestamp || httpTimings.tcpConnectionTimestamp,
    httpTimings.responseBodyStartTimestamp
  );
  const contentTransfer = findDuration(
    httpTimings.responseBodyStartTimestamp,
    httpTimings.responseBodyEndTimestamp
  );
  const total = findDuration(
    httpTimings.startTimestamp,
    httpTimings.responseBodyEndTimestamp
  );
  return {
    dnsLookup,
    tcpConnectionTime,
    tlsHandshakeTime,
    firstByte,
    contentTransfer,
    total
  };
}

function findDuration([secStart, nanoSecStart], [secEnd, nanoSecEnd]) {
  return ((secEnd - secStart) * 1e9 + (nanoSecEnd - nanoSecStart)) / 1e6;
}
