import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * A tiny hand-rolled icon set. Five stroke icons is not worth an icon library,
 * and react-native-svg is already here for the charts.
 */
export type IconName = 'today' | 'strength' | 'cardio' | 'body' | 'fuel' | 'settings';

const paths: Record<IconName, (color: ColorValue) => React.ReactNode> = {
  today: (c) => (
    <>
      <Path d="M3 10.5 12 3l9 7.5" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M5.5 9.5V20h13V9.5" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  strength: (c) => (
    <>
      <Path d="M4 9v6M7 7v10M17 7v10M20 9v6" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M7 12h10" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  cardio: (c) => (
    <>
      <Circle cx={6} cy={17} r={3.2} stroke={c} strokeWidth={2} fill="none" />
      <Circle cx={18} cy={17} r={3.2} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M6 17l4-7h5l3 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M10 10h5" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  body: (c) => (
    <>
      <Circle cx={12} cy={5} r={2.4} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M12 8v6m0 0-3 6m3-6 3 6M8 10h8" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  fuel: (c) => (
    <Path
      d="M12 3c2.5 3 5 5 5 8.5A5 5 0 0 1 7 11.5C7 9 8.5 7.5 9.5 6.5c.5 1.5 1 2 2 2.5 0-2 .5-4 .5-6Z"
      stroke={c}
      strokeWidth={2}
      strokeLinejoin="round"
      fill="none"
    />
  ),
  settings: (c) => (
    <>
      <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={2} fill="none" />
      <Path
        d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
};

export function Icon({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths[name](color)}
    </Svg>
  );
}
