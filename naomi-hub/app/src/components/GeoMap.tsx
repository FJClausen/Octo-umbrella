import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import type { Place } from '../geo/data';

/** Natural Earth outlines drawn with react-native-svg. Tapping a shape calls onPress with its id. */
export const GeoMap = memo(function GeoMap({
  places,
  viewBox,
  width,
  fillFor,
  onPress,
}: {
  places: Place[];
  viewBox: [number, number, number, number];
  width: number;
  fillFor: (id: string) => string;
  onPress?: (id: string) => void;
}) {
  const [x, y, w, h] = viewBox;
  const height = Math.round((width * h) / w);
  return (
    <Svg width={width} height={height} viewBox={`${x} ${y} ${w} ${h}`}>
      {places.map((p) => (
        <Path
          key={p.id}
          d={p.path}
          fill={fillFor(p.id)}
          stroke="#5b4a36"
          strokeWidth={w / 900}
          onPress={onPress ? () => onPress(p.id) : undefined}
        />
      ))}
    </Svg>
  );
});
