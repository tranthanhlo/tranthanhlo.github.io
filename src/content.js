// Each stop pairs a Da Nang landmark with one section of the portfolio, in Vietnamese and English.
// A stop may name its own model file, e.g. glb: 'models/rong.glb' (see public/models/README.md);
// without one the model built in code is used.
// TODO: replace the sample projects before publishing.

export const ui = {
  vi: {
    title: 'BIM/CAD Software Developer',
    lights: 'Đèn công trình',
    lang: 'EN',
    eyebrow: 'Triển lãm · Đà Nẵng',
    heading: 'Sáu biểu tượng,<br /><em>một hành trình</em>',
    intro: 'Mỗi mô hình kể một phần câu chuyện của tôi. Kéo để xoay, chụm hoặc cuộn để phóng to, chạm vào mô hình để xem.',
    start: 'Vào triển lãm',
    prev: '‹ Trước',
    next: 'Tiếp ›',
    close: 'Đóng',
  },
  en: {
    title: 'BIM/CAD Software Developer',
    lights: 'Landmark lights',
    lang: 'VI',
    eyebrow: 'Exhibition · Da Nang',
    heading: 'Six landmarks,<br /><em>one journey</em>',
    intro: 'Each model tells part of my story. Drag to rotate, pinch or scroll to zoom, and tap a model to look closer.',
    start: 'Enter the exhibition',
    prev: '‹ Back',
    next: 'Next ›',
    close: 'Close',
  },
};

export const stops = [
  {
    id: 'rong',
    peakLabels: null,
    vi: {
      landmark: 'Cầu Rồng',
      section: 'Giới thiệu',
      fact: 'Dài 666 m, khánh thành năm 2013. Rồng phun lửa và phun nước lúc 21h tối thứ Bảy, Chủ nhật.',
      body: `
        <p class="lead">Xin chào, tôi là <strong>Trần Thanh Lộ</strong>, BIM/CAD Software Developer tại Đà Nẵng.</p>
        <p>Tôi phát triển plugin và công cụ tự động hóa bằng <strong>C#</strong> và <strong>C++</strong> trên nền <strong>Revit API</strong> và <strong>ArchiCAD API</strong>, giúp tối ưu quy trình BIM và AEC.</p>
        <p>Hiện tôi đang mở rộng sang AutoCAD, Tekla và các nền tảng BIM/CAD khác.</p>`,
      action: 'Xem rồng phun lửa',
    },
    en: {
      landmark: 'Dragon Bridge',
      section: 'About',
      fact: '666 m long, opened in 2013. The dragon breathes fire and water at 9 pm on Saturdays and Sundays.',
      body: `
        <p class="lead">Hi, I'm <strong>Trần Thanh Lộ</strong>, a BIM/CAD Software Developer based in Da Nang, Vietnam.</p>
        <p>I build plugins and automation tools in <strong>C#</strong> and <strong>C++</strong> on the <strong>Revit API</strong> and <strong>ArchiCAD API</strong> to streamline BIM and AEC workflows.</p>
        <p>I'm currently expanding into AutoCAD, Tekla, and other BIM/CAD platforms.</p>`,
      action: 'Watch the dragon breathe fire',
    },
    action: 'fire',
  },
  {
    id: 'nguhanhson',
    peakLabels: ['C#', 'C++', 'Revit API', 'ArchiCAD API', 'WPF'],
    vi: {
      landmark: 'Ngũ Hành Sơn',
      section: 'Kỹ năng',
      fact: 'Năm ngọn núi đá mang tên ngũ hành: Kim, Mộc, Thủy, Hỏa, Thổ.',
      body: `
        <p>Năm ngọn núi, năm kỹ năng cốt lõi:</p>
        <ul class="skills">
          <li><span>Kim</span>C#</li>
          <li><span>Mộc</span>C++</li>
          <li><span>Thủy</span>Revit API</li>
          <li><span>Hỏa</span>ArchiCAD API</li>
          <li><span>Thổ</span>WPF</li>
        </ul>
        <p class="muted">Đang học thêm: AutoCAD API, Tekla Open API.</p>`,
    },
    en: {
      landmark: 'Marble Mountains',
      section: 'Skills',
      fact: 'Five marble peaks named after the five elements: Metal, Wood, Water, Fire, and Earth.',
      body: `
        <p>Five mountains, five core skills:</p>
        <ul class="skills">
          <li><span>Metal</span>C#</li>
          <li><span>Wood</span>C++</li>
          <li><span>Water</span>Revit API</li>
          <li><span>Fire</span>ArchiCAD API</li>
          <li><span>Earth</span>WPF</li>
        </ul>
        <p class="muted">Currently learning: AutoCAD API, Tekla Open API.</p>`,
    },
  },
  {
    id: 'songhan',
    vi: {
      landmark: 'Cầu sông Hàn',
      section: 'Hành trình',
      fact: 'Cầu quay đầu tiên của Việt Nam, khánh thành năm 2000. Ban đêm cầu quay để tàu thuyền đi qua.',
      body: `
        <ol class="timeline">
          <li><strong>Prima Solutions</strong><span>BIM/CAD Software Developer</span></li>
          <li><strong>Đại học Bách khoa – Đại học Đà Nẵng</strong><span>Học vấn</span></li>
        </ol>`,
    },
    en: {
      landmark: 'Han River Bridge',
      section: 'Journey',
      fact: "Vietnam's first swing bridge, opened in 2000. At night it swings open to let ships pass.",
      body: `
        <ol class="timeline">
          <li><strong>Prima Solutions</strong><span>BIM/CAD Software Developer</span></li>
          <li><strong>Danang University of Science and Technology</strong><span>Education</span></li>
        </ol>`,
    },
  },
  {
    id: 'cauvang',
    vi: {
      landmark: 'Cầu Vàng',
      section: 'Dự án',
      fact: 'Trên đỉnh Bà Nà, khánh thành năm 2018, được nâng đỡ bởi đôi bàn tay đá khổng lồ.',
      body: `
        <p class="muted">Nội dung mẫu, sẽ thay bằng dự án thật.</p>
        <div class="card"><strong>Plugin Revit: tự động tạo sheet</strong><span>C# · Revit API · WPF</span></div>
        <div class="card"><strong>Add-on ArchiCAD: xuất khối lượng</strong><span>C++ · ArchiCAD API</span></div>
        <div class="card"><strong>Công cụ kiểm tra mô hình</strong><span>C# · Revit API</span></div>`,
    },
    en: {
      landmark: 'Golden Bridge',
      section: 'Projects',
      fact: 'High in the Ba Na Hills, opened in 2018, held up by a pair of giant stone hands.',
      body: `
        <p class="muted">Sample content, to be replaced with real projects.</p>
        <div class="card"><strong>Revit plugin: automatic sheet creation</strong><span>C# · Revit API · WPF</span></div>
        <div class="card"><strong>ArchiCAD add-on: quantity export</strong><span>C++ · ArchiCAD API</span></div>
        <div class="card"><strong>Model checking tool</strong><span>C# · Revit API</span></div>`,
    },
  },
  {
    id: 'thuanphuoc',
    vi: {
      landmark: 'Cầu Thuận Phước',
      section: 'Dịch vụ',
      fact: 'Cầu treo dây võng dài gần 1,9 km nơi sông Hàn đổ ra vịnh Đà Nẵng, thông xe năm 2009.',
      body: `
        <p>Kết nối phần mềm với công việc thiết kế và thi công:</p>
        <ul class="list">
          <li>Phát triển plugin Revit theo yêu cầu</li>
          <li>Phát triển add-on ArchiCAD</li>
          <li>Tự động hóa quy trình BIM</li>
          <li>Tư vấn và đào tạo lập trình BIM</li>
        </ul>`,
    },
    en: {
      landmark: 'Thuan Phuoc Bridge',
      section: 'Services',
      fact: 'A suspension bridge nearly 1.9 km long where the Han River meets Da Nang Bay, opened in 2009.',
      body: `
        <p>Connecting software with design and construction:</p>
        <ul class="list">
          <li>Custom Revit plugin development</li>
          <li>ArchiCAD add-on development</li>
          <li>BIM workflow automation</li>
          <li>BIM programming consulting and training</li>
        </ul>`,
    },
  },
  {
    id: 'sunwheel',
    vi: {
      landmark: 'Vòng quay Mặt Trời',
      section: 'Liên hệ',
      fact: 'Vòng quay cao 115 m ở công viên Châu Á, bên bờ tây sông Hàn.',
      body: `
        <p>Bạn có dự án BIM cần tự động hóa? Hãy nói chuyện với tôi.</p>
        <a class="btn" href="https://www.linkedin.com/in/tranthanhlo" target="_blank" rel="noopener">Kết nối trên LinkedIn</a>`,
    },
    en: {
      landmark: 'Sun Wheel',
      section: 'Contact',
      fact: 'A 115 m Ferris wheel in Asia Park, on the west bank of the Han River.',
      body: `
        <p>Have a BIM project that needs automating? Let's talk.</p>
        <a class="btn" href="https://www.linkedin.com/in/tranthanhlo" target="_blank" rel="noopener">Connect on LinkedIn</a>`,
    },
  },
];
