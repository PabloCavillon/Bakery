import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Paz y Milu — Cookies artesanales por encargo · Córdoba'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0c0c0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '80px 90px',
        }}
      >
        {/* top label */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: 90,
            color: '#908e6a',
            fontSize: 22,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          CORDOBA · ARGENTINA
        </div>

        {/* cookie watermark */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            fontSize: 420,
            opacity: 0.04,
            lineHeight: 1,
          }}
        >
          🍪
        </div>

        {/* headline */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ color: '#fafaf0', fontSize: 180, fontWeight: 900, letterSpacing: '-0.01em' }}>
            PAZ
          </span>
          <span style={{ color: '#e8c030', fontSize: 180, fontWeight: 900, letterSpacing: '-0.01em', marginTop: -20 }}>
            Y MILU
          </span>
        </div>

        {/* tagline */}
        <div
          style={{
            color: '#908e6a',
            fontSize: 26,
            marginTop: 28,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Cookies artesanales · Tartas · Tortas por encargo
        </div>
      </div>
    ),
    { ...size }
  )
}
