// android-rn/src/components/ProgressBar.jsx
// 진행률 표시 컴포넌트 (#14, #4)

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export default function ProgressBar({ value = 0, label = '' }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         Math.max(0, Math.min(100, value)),
      duration:        300,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
      <Text style={styles.pct}>{Math.round(value)}%</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginVertical: 12 },
  track:   { height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' },
  fill:    { height: '100%', backgroundColor: '#FF6B35', borderRadius: 4 },
  pct:     { color: '#FF6B35', fontSize: 13, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  label:   { color: '#888', fontSize: 12, marginTop: 2 },
});
