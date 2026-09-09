const CONFIG_KEY = `slink-calendar.config`;
const DEFAULT_CONFIG = {
  calendarId: '',
  syncBeforeDays: 7,
  syncAfterDays: 30,
  syncIntervalHours: 12,
  categoryColors: {
    [EventCategories.GENERAL]: '#2098c7',
    [EventCategories.COURSE]: '#31becb',
    [EventCategories.EXAM]: '#df4471',
    [EventCategories.ASSIGNMENT]: '#f1a32a',
    [EventCategories.MEETING]: '#9f44ef',
    [EventCategories.PERSONAL]: '#57bf56',
    [EventCategories.OTHER]: '#b3b0af',
  },
  excludedSources: {},
};

function loadConfig() {
  const value = PropertiesService.getUserProperties().getProperty(CONFIG_KEY);
  return value ? JSON.parse(value) : { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  const value = JSON.stringify(config);
  PropertiesService.getUserProperties().setProperty(CONFIG_KEY, value);
}

function getSyncRange(config) {
  const fromDate = new Date;
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setDate(fromDate.getDate() - config.syncBeforeDays);

  const toDate = new Date;
  toDate.setHours(23, 59, 59, 999);
  toDate.setDate(toDate.getDate() + config.syncAfterDays);

  return { fromDate, toDate };
}

function getCategoryLabels(config) {
  return Object.values(EventCategories).map(categoryName => ({
    name: categoryName,
    backgroundColor: config.categoryColors[categoryName],
  }));
}
