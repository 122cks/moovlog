// android-rn/src/components/TrimControl.jsx
// 터치 기반 클립 트림 컨트롤러 (#18)
// 더블탭: 5초 이동, 슬라이더: 시작/종료 지점 조절

import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, PanResponder,
  TouchableOpacity,
} from 'react-native';

const TRACK_WIDTH = 280;
const CLAMP = (v, min, max) => Math.min(max, Math.max(min, v));

export default function TrimControl({ scene, onChange }) {
  const startRef = useRef(scene.start    || 0);
  const durRef   = useRef(scene.duration || 3);
  const maxDur   = 30; // 최대 씬 길이(초)

  // 왼쪽 핸들 (시작점)
  const leftPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const delta = (g.dx / TRACK_WIDTH) * maxDur;
      const newStart = CLAMP(startRef.current + delta, 0, startRef.current + durRef.current - 0.5);
      onChange({ start: Math.round(newStart * 10) / 10 });
    },
  });

  // 오른쪽 핸들 (길이)
  const rightPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      const delta = (g.dx / TRACK_WIDTH) * maxDur;
      const newDur = CLAMP(durRef.current + delta, 0.5, maxDur - startRef.current);
      onChange({ duration: Math.round(newDur * 10) / 10 });
    },
  });

  // 더블탭으로 5초 전후 이동 (#68)
  const lastTap = useRef(0);
  function handleDoubleTap(dir) {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onChange({ start: CLAMP((scene.start || 0) + dir * 5, 0, 120) });
    }
    lastTap.current = now;
  }

  const leftPct  = ((scene.start || 0) / maxDur) * 100;
  const durPct   = (Math.max(0.5, scene.duration || 3) / maxDur) * 100;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        시작 {(scene.start || 0).toFixed(1)}s  /  길이 {(scene.duration || 3).toFixed(1)}s
      </Text>
      <View style={styles.track}>
        {/* 선택 구간 */}
        <View style={[styles.selected, { left: `${leftPct}%`, width: `${Math.min(durPct, 100 - leftPct)}%` }]} />
        {/* 왼쪽 핸들 */}
        <View style={[styles.handle, styles.handleLeft, { left: `${leftPct}%` }]}
              {...leftPan.panHandlers} />
        {/* 오른쪽 핸들 */}
        <View style={[styles.handle, styles.handleRight, { left: `${Math.min(leftPct + durPct, 98)}%` }]}
              {...rightPan.panHandlers} />
      </View>
      <View style={styles.seekRow}>
        <TouchableOpacity onPress={() => handleDoubleTap(-1)} style={styles.seekBtn}>
          <Text style={styles.seekTxt}>◀◀ 5s</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDoubleTap(1)} style={styles.seekBtn}>
          <Text style={styles.seekTxt}>5s ▶▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:     { marginVertical: 8, width: TRACK_WIDTH },
  label:       { color: '#aaa', fontSize: 12, marginBottom: 6 },
  track:       { height: 20, backgroundColor: '#333', borderRadius: 4, position: 'relative' },
  selected:    { position: 'absolute', height: '100%', backgroundColor: '#FF6B3566', borderRadius: 4 },
  handle:      { position: 'absolute', top: -4, width: 12, height: 28, backgroundColor: '#FF6B35', borderRadius: 6 },
  handleLeft:  { transform: [{ translateX: -6 }] },
  handleRight: { transform: [{ translateX: -6 }] },
  seekRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  seekBtn:     { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#222', borderRadius: 6 },
  seekTxt:     { color: '#FF6B35', fontSize: 12 },
});
