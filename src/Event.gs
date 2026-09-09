// @see https://slink.ptit.edu.vn/p__Calendar__index.5ad87fc6.async.js

const EventCategories = {
  GENERAL: 'Chung',
  COURSE: 'Học phần',
  EXAM: 'Lịch thi',
  ASSIGNMENT: 'Bài tập',
  MEETING: 'Họp lớp',
  PERSONAL: 'Cá nhân',
  OTHER: 'Khác',
};

const EventSources = {
  QLDT_THOIKHOABIEU: {
    title: 'Thời khoá biểu',
    url: 'https://gwdu.ptit.edu.vn/qldt/thoi-khoa-bieu/sv',
    process: data => ({
      title: data['lopHocPhan']?.['hocPhan']?.['ten']
        || data['lopHocPhan']?.['maHocPhan']
        || data['tenLopHocPhan'] || '',
      location: data['phongHoc'] ?? '',
      category: EventCategories.COURSE,
      startDate: new Date(data['thoiGianBatDau']),
      endDate: new Date(data['thoiGianKetThuc']),
    }),
  },
  SLINK_SUKIEN: {
    title: 'Sự kiện',
    url: 'https://gwdu.ptit.edu.vn/slink/su-kien/user',
    process: data => ({
      title: data['tenSuKien'] ?? '',
      location: data['diaDiem'] ?? '',
      category: Object.values(EventCategories).includes(data['loaiSuKien'])
        ? data['loaiSuKien'] : EventCategories.GENERAL,
      startDate: new Date(data['thoiGianBatDau']),
      endDate: new Date(data['thoiGianKetThuc']),
    }),
  },
  QLDT_LICHTHI: {
    title: 'Lịch thi',
    url: 'https://gwdu.ptit.edu.vn/khao-thi/lich-thi/lich-thi/sv',
    process: data => ({
      title: data['danhSachHocPhan']?.map(course => course['ten'])?.join(', '),
      location: data['phong']?.['ma'] ?? '',
      category: EventCategories.EXAM,
      startDate: new Date(data['thoiGianBatDau']),
      endDate: new Date(data['thoiGianKetThuc']),
    }),
  },
  QLDT_BAITAP: {
    title: 'Bài tập',
    url: 'https://gwdu.ptit.edu.vn/qldt/assignment/lich/sinh-vien',
    process: data => ({
      title: `${data['assignment']?.['noiDung']} - ${data['assignment']?.['tenLopHocPhan']}`,
      location: data['assignment']?.['tenLopHocPhan'] ?? '',
      category: EventCategories.ASSIGNMENT,
      startDate: new Date(data['assignment']?.['thoiGianGiao'] || data['assignment']?.['thoiGianBatDau']),
      endDate: new Date(data['assignment']?.['thoiGianKetThuc']),
    }),
  },
  QLDT_DKTINCHI: {
    title: 'Đăng ký tín chỉ',
    url: 'https://gwdu.ptit.edu.vn/qldt/dang-ky-tin-chi/dot/lich/sinh-vien',
    process: data => ({
      title: `ĐKTC: ${data['ten']}`,
      location: '',
      category: EventCategories.GENERAL,
      allDay: true,
      startDate: new Date(data['thoiGianBatDau']),
      endDate: new Date(data['thoiGianKetThuc']),
    }),
  },
};

function fetchRawEvents(accessToken, sourceUrl, fromDate, toDate) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'X-Data-Partition-Code': 'PTIT',
  };

  const url = `${sourceUrl}/from/${fromDate.toISOString()}/to/${toDate.toISOString()}`;
  const response = UrlFetchApp.fetch(url, { headers });

  const result = JSON.parse(response.getContentText());
  if (!result['success']) {
    throw new Error('Response status is not ok');
  }

  return result['data'];
}

function createEvent(eventInfo, eventLabelId) {
  const fnv1a64 = (input) => {
    const prime = BigInt('0x100000001b3'),
      offsetBasis = BigInt('0xcbf29ce484222325'),
      mask = 0xff, bits = 64, radix = 16;
    return Utilities.newBlob(input).getBytes()
      .reduce(
        (hash, byte) =>
          BigInt.asUintN(bits, hash ^ BigInt(byte & mask) * prime),
        offsetBasis,
      )
      .toString(radix);
  };

  const objectStr = JSON.stringify({ eventInfo, eventLabelId });
  const event = {
    summary: eventInfo.title,
    location: eventInfo.location,
    eventLabelId: eventLabelId,
    extendedProperties: {
      private: {
        appId: ScriptApp.getScriptId(),
        hash: fnv1a64(objectStr),
      },
    },
  };

  const { startDate, endDate } = eventInfo;
  if (eventInfo.allDay) {
    endDate.setDate(endDate.getDate() + 1);

    event.start = { date: startDate.toISOString().split('T')[0] };
    event.end = { date: endDate.toISOString().split('T')[0] };
  } else {
    event.start = { dateTime: startDate.toISOString() };
    event.end = { dateTime: endDate.toISOString() };
  }

  return event;
}
