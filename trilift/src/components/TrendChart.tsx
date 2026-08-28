import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { colors, radius, space, type } from '@/lib/theme';

export type TrendPoint = { date: string; value: number };

type Props = {
  /** Raw readings — drawn as faint dots so the noise is visible but recessive. */
  points: TrendPoint[];
  /** The smoothed line. Falls back to `points` when omitted. */
  trend?: TrendPoint[];
  /** Horizontal reference line, e.g. the goal weight. */
  reference?: { value: number; label: string };
  unit: string;
  color?: string;
  height?: number;
  /** Fewer decimals for watts than for kilograms. */
  digits?: number;
};

/**
 * A single-series line chart. One series means no legend — the card heading
 * names it — and the latest value is labelled directly rather than putting a
 * number on every point. Tapping a point is the touch equivalent of a hover
 * tooltip.
 */
export function TrendChart({
  points,
  trend,
  reference,
  unit,
  color = colors.body,
  height = 180,
  digits = 1,
}: Props) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const pad = { top: 16, right: 56, bottom: 24, left: 8 };

  const geometry = useMemo(() => {
    if (!width || points.length === 0) return null;

    const line = trend?.length ? trend : points;
    const values = [...points.map((p) => p.value), ...line.map((p) => p.value)];
    if (reference) values.push(reference.value);

    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    // A little headroom so marks never touch the frame.
    const span = max - min;
    min -= span * 0.08;
    max += span * 0.08;

    const plotW = Math.max(1, width - pad.left - pad.right);
    const plotH = Math.max(1, height - pad.top - pad.bottom);

    const x = (i: number, n: number) => pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = (v: number) => pad.top + plotH - ((v - min) / (max - min)) * plotH;

    const path = line
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i, line.length).toFixed(1)},${y(p.value).toFixed(1)}`)
      .join(' ');

    return {
      path,
      dots: points.map((p, i) => ({ ...p, cx: x(i, points.length), cy: y(p.value) })),
      refY: reference ? y(reference.value) : null,
      lastLine: line.length ? { x: x(line.length - 1, line.length), y: y(line[line.length - 1].value), value: line[line.length - 1].value } : null,
      plotW,
      plotH,
    };
  }, [width, height, points, trend, reference]);

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={type.caption}>Nothing logged yet — the chart fills in as you go.</Text>
      </View>
    );
  }

  const active = selected != null ? geometry?.dots[selected] : null;

  return (
    <View onLayout={onLayout}>
      {geometry ? (
        <>
          <Svg width={width} height={height}>
            {/* Reference line: recessive, dashed, labelled at the right. */}
            {geometry.refY != null && reference ? (
              <>
                <Line
                  x1={pad.left}
                  y1={geometry.refY}
                  x2={width - pad.right}
                  y2={geometry.refY}
                  stroke={colors.textFaint}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={width - pad.right + 6}
                  y={geometry.refY + 4}
                  fill={colors.textDim}
                  fontSize={11}
                >
                  {reference.label}
                </SvgText>
              </>
            ) : null}

            <Path d={geometry.path} stroke={color} strokeWidth={2} fill="none" />

            {geometry.dots.map((d, i) => (
              <Circle
                key={d.date}
                cx={d.cx}
                cy={d.cy}
                r={selected === i ? 5 : 3}
                fill={selected === i ? color : colors.surfaceAlt}
                stroke={color}
                strokeWidth={selected === i ? 2 : 1.5}
              />
            ))}

            {/* Direct label on the latest trend value — not on every point. */}
            {geometry.lastLine ? (
              <SvgText
                x={geometry.lastLine.x + 8}
                y={geometry.lastLine.y + 4}
                fill={colors.text}
                fontSize={13}
                fontWeight="700"
              >
                {`${geometry.lastLine.value.toFixed(digits)}${unit}`}
              </SvgText>
            ) : null}
          </Svg>

          {/* Touch targets are bigger than the marks they select. */}
          <View style={[StyleSheet.absoluteFill, styles.touchRow]} pointerEvents="box-none">
            {geometry.dots.map((d, i) => (
              <Pressable
                key={d.date}
                accessibilityRole="button"
                accessibilityLabel={`${d.date}: ${d.value.toFixed(digits)}${unit}`}
                onPress={() => setSelected(selected === i ? null : i)}
                style={{
                  position: 'absolute',
                  left: d.cx - 16,
                  top: 0,
                  width: 32,
                  height,
                }}
              />
            ))}
          </View>
        </>
      ) : (
        <View style={{ height }} />
      )}

      {active ? (
        <View style={styles.tooltip}>
          <Text style={type.label}>{active.date}</Text>
          <Text style={styles.tooltipValue}>{`${active.value.toFixed(digits)}${unit}`}</Text>
        </View>
      ) : (
        <Text style={[type.caption, styles.hint]}>Tap a point to read it</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  touchRow: { flexDirection: 'row' },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipValue: { ...type.body, fontWeight: '700' },
  hint: { textAlign: 'center', paddingTop: space.xs },
});
