/**
 * The English app mark. The source image is a square with a dark navy backdrop, so it is
 * cropped to a circle and given a soft glow ring to sit on any background of the app.
 */
export default function Logo({ size = 56, alt = '' }) {
  const pixels = typeof size === 'number' ? `${size}px` : size

  return (
    <span className="logo" style={{ '--logo-size': pixels }}>
      <img src="/logo.jpg" alt={alt} width="160" height="160" decoding="async" draggable="false" />
    </span>
  )
}
