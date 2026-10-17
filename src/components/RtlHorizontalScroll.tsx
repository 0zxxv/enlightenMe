import React, { useCallback, useEffect, useRef } from 'react';
import { ScrollView, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from '@/i18n';
import { yogaDirection } from '@/utils/rtl';

type Props = Omit<ScrollViewProps, 'horizontal'> & {
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Horizontal strip that starts at the reading-start edge:
 * LTR → first item on the left; RTL → first item on the right (scroll left for more).
 *
 * Isolates Yoga `direction` so parent RTL + `row-reverse` does not double-flip.
 */
export function RtlHorizontalScroll({
  children,
  contentContainerStyle,
  onContentSizeChange,
  onLayout,
  ...rest
}: Props) {
  const { isRTL } = useTranslation();
  const ref = useRef<ScrollView>(null);
  const pinned = useRef(false);

  useEffect(() => {
    pinned.current = false;
  }, [isRTL]);

  const pinToStart = useCallback(() => {
    if (!isRTL || pinned.current) return;
    pinned.current = true;
    requestAnimationFrame(() => {
      ref.current?.scrollToEnd({ animated: false });
    });
  }, [isRTL]);

  const handleContentSizeChange = useCallback(
    (w: number, h: number) => {
      pinToStart();
      onContentSizeChange?.(w, h);
    },
    [onContentSizeChange, pinToStart],
  );

  const handleLayout = useCallback(
    (e: Parameters<NonNullable<ScrollViewProps['onLayout']>>[0]) => {
      pinToStart();
      onLayout?.(e);
    },
    [onLayout, pinToStart],
  );

  return (
    <ScrollView
      key={isRTL ? 'rtl' : 'ltr'}
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      {...rest}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      contentContainerStyle={[
        contentContainerStyle,
        yogaDirection(false),
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      {children}
    </ScrollView>
  );
}
