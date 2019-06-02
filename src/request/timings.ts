type HighResolutionTimestamp = [number, number];

export interface HttpTiming {
  startTime: HighResolutionTimestamp;
  dnsLookupTime: HighResolutionTimestamp;
  tcpConnectionTime: HighResolutionTimestamp;
  tlsHandshakeTime: HighResolutionTimestamp;
  responseBodyStartTime: HighResolutionTimestamp;
  responseBodyEndTime: HighResolutionTimestamp;
}

export default function getTimings(httpTimings) {
  const dnsLookup = httpTimings.dnsLookupTime
    ? findDuration(httpTimings.startTime, httpTimings.dnsLookupTime)
    : undefined;
  const tcpConnectionTime = httpTimings.tcpConnectionTime
    ? findDuration(
        httpTimings.dnsLookupTime || httpTimings.startTime,
        httpTimings.tcpConnectionTime
      )
    : undefined;
  const tlsHandshakeTime = httpTimings.tlsHandshakeTime
    ? findDuration(httpTimings.tcpConnectionTime, httpTimings.tlsHandshakeTime)
    : undefined;
  const firstByte = findDuration(
    httpTimings.tlsHandshakeTime || httpTimings.tcpConnectionTime,
    httpTimings.responseBodyStartTime
  );
  const contentTransfer = findDuration(
    httpTimings.responseBodyStartTime,
    httpTimings.responseBodyEndTime
  );
  const total = findDuration(
    httpTimings.startTime,
    httpTimings.responseBodyEndTime
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
  