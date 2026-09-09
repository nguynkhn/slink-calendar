function getAllPages(request, ...params) {
  const items = [];
  let pageToken;

  do {
    const result = request(...params);

    items.push(...result['items']);
    pageToken = result['nextPageToken'];
  } while (pageToken);

  return items;
}

function getOwnedCalendars() {
  return getAllPages(Calendar.CalendarList.list, {
    minAccessRole: 'owner',
    maxResults: 250,
  });
}

function getGeneratedEvents(calendarId, fromDate, toDate) {
  const appId = ScriptApp.getScriptId();

  return getAllPages(Calendar.Events.list, calendarId, {
    maxResults: 2500,
    privateExtendedProperty: `appId=${appId}`,
    timeMin: fromDate.toISOString(),
    timeMax: toDate.toISOString(),
  });
}

function syncCalendarLabels(calendarId, calendarLabels) {
  const calendar = Calendar.Calendars.get(calendarId);

  Calendar.Calendars.update({
    summary: calendar.summary,
    labelProperties: {
      eventLabels: calendarLabels,
    },
  }, calendar.id);
}

function syncCalendarEvents(calendarId, oldEvents, newEvents) {
  // in A not in B
  const difference = (a, b) => {
    const getHash = x => x.extendedProperties.private['hash'];
    const hashes = new Set(b.map(getHash));
    return a.filter(x => !hashes.has(getHash(x)));
  };

  const addedEvents = difference(newEvents, oldEvents);
  const removedEvents = difference(oldEvents, newEvents);

  addedEvents.forEach(event =>
    Calendar.Events.insert(event, calendarId, { eventLabelVersion: 1 }));
  removedEvents.forEach(event => Calendar.Events.remove(calendarId, event.id));

  return { added: addedEvents.length, removed: removedEvents.length };
}
