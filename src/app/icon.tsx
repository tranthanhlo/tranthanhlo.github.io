import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

// The app icon: a gold rounded square with an "L"
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' }}>
        <div style={{ width: 400, height: 400, borderRadius: 96, background: '#d8b46a', color: '#17120a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 300, fontWeight: 700 }}>
          L
        </div>
      </div>
    ),
    size,
  );
}
