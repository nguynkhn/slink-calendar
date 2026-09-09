function sync() {
  const service = getService_();
  if (!service.hasAccess()) {
    const authUrl = service.getAuthorizationUrl();
    Logger.log(`Open this link to authorize: ${authUrl}`);
    return;
  }

  const config = loadConfig();
  if (!config._triggerId) {
    const triggerId = ScriptApp.newTrigger('sync')
      .timeBased()
      .everyHours(config.syncIntervalHours)
      .create()
      .getUniqueId();
    config._triggerId = triggerId;
    saveConfig(config);

    Logger.log(`Trigger created with ID: ${triggerId}`);
  }

  const { fromDate, toDate } = getSyncRange(config);
  const oldEvents = getGeneratedEvents(config.calendarId, fromDate, toDate);

  const calendarLabels = getCalendarLabels(config.calendarId, getCategoryLabels(config));
  const labelIds = Object.fromEntries(
    calendarLabels.map(calendarLabel => [calendarLabel.name, calendarLabel.id]),
  );

  const accessToken = service.getAccessToken();
  const eventSources = Object.keys(EventSources)
    .filter(sourceId => !config.excludedSources[sourceId])
    .map(sourceId => EventSources[sourceId]);

  const eventInfos = eventSources.flatMap(eventSource =>
    fetchRawEvents(accessToken, eventSource.url, fromDate, toDate)
      .map(eventSource.process)
  );
  const newEvents = eventInfos.map(eventInfo =>
    createEvent(eventInfo, labelIds[eventInfo.category])
  );

  const { added, removed } = syncCalendarEvents(config.calendarId, oldEvents, newEvents);
  Logger.log(`Added ${added} events, removed ${removed} events`);
}

function main() {
  sync();
}
