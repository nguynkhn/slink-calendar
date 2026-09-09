function main() {
  const service = getService_();
  if (!service.hasAccess()) {
    const authUrl = service.getAuthorizationUrl();
    Logger.log(`Open this link to authorize: ${authUrl}`);
    return;
  }

  const config = loadConfig();

  const calendarLabels = getCalendarLabels(config);
  syncCalendarLabels(config.calendarId, calendarLabels);
  const oldEvents = getGeneratedEvents(config.calendarId, fromDate, toDate);

  const accessToken = service.getAccessToken();
  const eventSources = Object.keys(EventSources)
    .filter(sourceId => !config.excludedSources[sourceId])
    .map(sourceId => EventSources[sourceId]);
  const { fromDate, toDate } = getSyncRange(config);

  const eventInfos = eventSources.flatMap(eventSource =>
    fetchRawEvents(accessToken, eventSource.url, fromDate, toDate)
      .map(eventSource.process)
  );
  const newEvents = eventInfos.map(eventInfo =>
    createEvent(eventInfo, calendarLabels[eventInfo.category].id)
  );

  const { added, removed } = syncCalendarEvents(config.calendarId, oldEvents, newEvents);
  Logger.log(`Added ${added} events, removed ${removed} events`);
}
