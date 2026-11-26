// A steady colour for a name, so each tool gets its own "thumbnail" colour until it has a real picture
export function hueOf(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function coverStyle(name: string): { backgroundImage: string } {
  const h = hueOf(name);
  return { backgroundImage: `linear-gradient(135deg, hsl(${h} 58% 30%), hsl(${(h + 50) % 360} 62% 16%))` };
}
