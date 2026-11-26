import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// iPhone home-screen icon (iOS rounds the corners itself, so it is a full square)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d8b46a', color: '#17120a', fontSize: 130, fontWeight: 700 }}>
        L
      </div>
    ),
    size,
  );
}
