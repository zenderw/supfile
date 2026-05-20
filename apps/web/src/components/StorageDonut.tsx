import { formatBytes } from '@/components/files/FileRow';
import type { SearchCategory } from '@/lib/api/search';
import type { CategorySizes } from '@/lib/api/stats';

interface Props {
  sizes: CategorySizes;
  onCategoryClick?: (category: SearchCategory) => void;
}

interface Slice {
  key: keyof CategorySizes;
  label: string;
  color: string;
  bytes: number;
}

const PALETTE: Record<keyof CategorySizes, { label: string; color: string }> = {
  image: { label: 'Images', color: '#3b82f6' },
  video: { label: 'Vidéos', color: '#ef4444' },
  audio: { label: 'Audio', color: '#8b5cf6' },
  pdf: { label: 'PDF', color: '#f59e0b' },
  document: { label: 'Documents', color: '#10b981' },
  other: { label: 'Autres', color: '#6b7280' },
};

const RADIUS = 60;
const STROKE = 20;
const CIRC = 2 * Math.PI * RADIUS;

export function StorageDonut({ sizes, onCategoryClick }: Props) {
  const slices: Slice[] = (Object.keys(PALETTE) as (keyof CategorySizes)[]).map((k) => ({
    key: k,
    label: PALETTE[k].label,
    color: PALETTE[k].color,
    bytes: Number(sizes[k]),
  }));

  const total = slices.reduce((s, x) => s + x.bytes, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pas encore de fichiers, l'espace disque sera affiché ici.
      </p>
    );
  }

  let offset = 0;
  const arcs = slices
    .filter((s) => s.bytes > 0)
    .map((s) => {
      const fraction = s.bytes / total;
      const dash = fraction * CIRC;
      const arc = (
        <circle
          key={s.key}
          r={RADIUS}
          cx="80"
          cy="80"
          fill="transparent"
          stroke={s.color}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRC - dash}`}
          strokeDashoffset={-offset}
          transform="rotate(-90 80 80)"
          style={onCategoryClick ? { cursor: 'pointer' } : undefined}
          onClick={onCategoryClick ? () => onCategoryClick(s.key) : undefined}
        >
          <title>
            {s.label} : {formatBytes(String(s.bytes))}
          </title>
        </circle>
      );
      offset += dash;
      return arc;
    });

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        aria-label="Répartition de l'espace disque"
      >
        <circle
          r={RADIUS}
          cx="80"
          cy="80"
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={STROKE}
        />
        {arcs}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          Total
        </text>
        <text
          x="80"
          y="92"
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 14, fontWeight: 700 }}
        >
          {formatBytes(String(total))}
        </text>
      </svg>

      <div className="flex-1 grid grid-cols-2 gap-1 text-sm">
        {slices
          .filter((s) => s.bytes > 0)
          .sort((a, b) => b.bytes - a.bytes)
          .map((s) => {
            const content = (
              <>
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-muted-foreground flex-1">{s.label}</span>
                <span className="font-medium">{formatBytes(String(s.bytes))}</span>
              </>
            );
            return onCategoryClick ? (
              <button
                key={s.key}
                type="button"
                onClick={() => onCategoryClick(s.key)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/40 text-left"
              >
                {content}
              </button>
            ) : (
              <div key={s.key} className="flex items-center gap-2 px-2 py-1">
                {content}
              </div>
            );
          })}
      </div>
    </div>
  );
}
