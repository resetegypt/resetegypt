import { useMemo } from 'react';

// ============================================================================
// Composants graphiques inline (SVG natif, zéro dépendance externe).
// Sparkline / LineChart / Heatmap — tous responsives via viewBox.
// ============================================================================

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Couleur du trait. Par défaut primary. */
  stroke?: string;
  /** Couleur du remplissage sous la courbe. Par défaut primary à 12 %. */
  fill?: string;
  /** Affiche un point sur la dernière valeur. */
  showLastDot?: boolean;
  ariaLabel?: string;
}

export function Sparkline({
  values,
  width = 80,
  height = 28,
  stroke = 'var(--color-primary, #1E0FBA)',
  fill = 'rgba(30, 15, 186, 0.10)',
  showLastDot = true,
  ariaLabel,
}: SparklineProps) {
  const { path, areaPath, lastPoint } = useMemo(() => {
    if (values.length === 0) return { path: '', areaPath: '', lastPoint: null };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = values.length > 1 ? width / (values.length - 1) : 0;
    const points = values.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return { x, y };
    });
    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    return { path, areaPath, lastPoint: points[points.length - 1] };
  }, [values, width, height]);

  if (values.length === 0) return null;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? 'tendance'}
      className="overflow-visible"
    >
      <path d={areaPath} fill={fill} stroke="none" />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showLastDot && lastPoint && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2.2} fill={stroke} />
      )}
    </svg>
  );
}

// ============================================================================
// LineChart — courbes multi-séries (pour l'évolution des scores 0-10).
// ============================================================================

export interface LineSeries {
  label: string;
  color: string;
  values: Array<number | null>;
}

interface LineChartProps {
  series: LineSeries[];
  /** Labels X (typiquement les dates). */
  xLabels: string[];
  min?: number;
  max?: number;
  height?: number;
  yTicks?: number[];
  ariaLabel?: string;
}

export function LineChart({
  series,
  xLabels,
  min = 0,
  max = 10,
  height = 220,
  yTicks = [0, 2, 4, 6, 8, 10],
  ariaLabel,
}: LineChartProps) {
  const padding = { top: 12, right: 16, bottom: 28, left: 36 };
  const width = 720;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const xCount = xLabels.length;
  const stepX = xCount > 1 ? innerW / (xCount - 1) : 0;
  const range = max - min || 1;

  function yFor(v: number): number {
    return padding.top + innerH - ((v - min) / range) * innerH;
  }
  function xFor(i: number): number {
    return padding.left + i * stepX;
  }

  // Quelles dates afficher sur l'axe X ? Si trop de points, on saute.
  const xLabelStep = Math.max(1, Math.ceil(xCount / 8));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? 'graphique évolution'}
      className="w-full h-auto"
    >
      {/* Grille horizontale */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yFor(tick)}
            y2={yFor(tick)}
            stroke="rgba(30, 15, 186, 0.06)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
          <text
            x={padding.left - 8}
            y={yFor(tick) + 4}
            textAnchor="end"
            className="fill-text-tertiary"
            style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}
          >
            {tick}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {xLabels.map((label, i) =>
        i % xLabelStep === 0 || i === xCount - 1 ? (
          <text
            key={`xl-${i}`}
            x={xFor(i)}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            className="fill-text-tertiary"
            style={{ fontSize: 10 }}
          >
            {label}
          </text>
        ) : null,
      )}

      {/* Séries */}
      {series.map((s, sIdx) => {
        // On construit un path en sautant les valeurs null
        const points = s.values
          .map((v, i) => (v === null ? null : { x: xFor(i), y: yFor(v), v, i }))
          .filter((p): p is { x: number; y: number; v: number; i: number } => p !== null);
        if (points.length === 0) return null;
        const path = points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(' ');
        return (
          <g key={`series-${sIdx}`}>
            <path
              d={path}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p) => (
              <circle
                key={`p-${sIdx}-${p.i}`}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={s.color}
                stroke="white"
                strokeWidth={1.5}
              >
                <title>{`${s.label}: ${p.v}/10 (${xLabels[p.i] ?? ''})`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// Heatmap — grille (rows × cols) avec intensité de couleur.
// Idéale pour les heures vs jours de la semaine.
// ============================================================================

export interface HeatmapCell {
  row: number;
  col: number;
  value: number;
}

interface HeatmapProps {
  cells: HeatmapCell[];
  rowLabels: string[];
  colLabels: string[];
  /** Couleur de base (le max sera à 100 % d'opacité). */
  baseColor?: string;
  cellSize?: number;
  ariaLabel?: string;
  /** Format custom de la valeur dans le title (tooltip natif). */
  formatTitle?: (cell: HeatmapCell, rowLabel: string, colLabel: string) => string;
}

export function Heatmap({
  cells,
  rowLabels,
  colLabels,
  baseColor = '30, 15, 186', // primary RGB
  cellSize = 28,
  ariaLabel,
  formatTitle,
}: HeatmapProps) {
  const max = Math.max(1, ...cells.map((c) => c.value));
  const labelGutter = 36;
  const headerH = 18;
  const w = labelGutter + colLabels.length * cellSize;
  const h = headerH + rowLabels.length * cellSize;

  // Index pour lookup rapide
  const lookup = new Map<string, number>();
  cells.forEach((c) => lookup.set(`${c.row}-${c.col}`, c.value));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel ?? 'heatmap'} className="w-full h-auto">
      {/* Col labels (header) */}
      {colLabels.map((cl, i) => (
        <text
          key={`col-${i}`}
          x={labelGutter + i * cellSize + cellSize / 2}
          y={headerH - 4}
          textAnchor="middle"
          className="fill-text-tertiary"
          style={{ fontSize: 9, fontVariantNumeric: 'tabular-nums' }}
        >
          {cl}
        </text>
      ))}
      {/* Row labels */}
      {rowLabels.map((rl, i) => (
        <text
          key={`row-${i}`}
          x={labelGutter - 4}
          y={headerH + i * cellSize + cellSize / 2 + 4}
          textAnchor="end"
          className="fill-text-tertiary"
          style={{ fontSize: 10, fontWeight: 600 }}
        >
          {rl}
        </text>
      ))}
      {/* Cells */}
      {rowLabels.map((rl, r) =>
        colLabels.map((cl, c) => {
          const v = lookup.get(`${r}-${c}`) ?? 0;
          // Intensité non linéaire : sqrt pour amplifier les petites valeurs.
          const intensity = v === 0 ? 0 : Math.max(0.1, Math.sqrt(v / max));
          const x = labelGutter + c * cellSize;
          const y = headerH + r * cellSize;
          return (
            <g key={`cell-${r}-${c}`}>
              <rect
                x={x + 1}
                y={y + 1}
                width={cellSize - 2}
                height={cellSize - 2}
                rx={3}
                fill={v === 0 ? 'rgba(30, 15, 186, 0.04)' : `rgba(${baseColor}, ${intensity})`}
                stroke={v === 0 ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)'}
                strokeWidth={1}
              >
                <title>
                  {formatTitle ? formatTitle({ row: r, col: c, value: v }, rl, cl) : `${rl} ${cl}: ${v}`}
                </title>
              </rect>
              {v > 0 && intensity > 0.45 && (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2 + 4}
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}
                >
                  {v}
                </text>
              )}
              {v > 0 && intensity <= 0.45 && (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2 + 4}
                  textAnchor="middle"
                  className="fill-primary-dark"
                  style={{ fontSize: 10, fontWeight: 600, fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}
                >
                  {v}
                </text>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
