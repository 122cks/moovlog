// android-rn/src/App.jsx
// React Native 메인 앱 — packages/shared 공유 모듈 활용 (#17)

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Alert, Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

// #17 packages/shared 공유 모듈 임포트
import { detectPlatform, getFFmpegAdapter } from '@moovlog/shared';
import { createEDL, validateEDL }           from '@moovlog/shared';
import { estimateFocusPoint, totalDuration } from '@moovlog/shared';

import { initFFmpegKit, requestMediaPermissions, renderWithAndroid } from './RenderBridge';
import ProgressBar from './components/ProgressBar';
import TrimControl from './components/TrimControl';

const Stack = createStackNavigator();

// ─── 홈 화면 ─────────────────────────────────────────────────────────────
function HomeScreen({ navigation }) {
  const [progress,   setProgress]   = useState(0);
  const [rendering,  setRendering]  = useState(false);
  const [statusMsg,  setStatusMsg]  = useState('파일을 선택해주세요');

  useEffect(() => {
    initFFmpegKit();
    requestMediaPermissions();
  }, []);

  // 미디어 선택 (#12, #13)
  async function pickMedia() {
    try {
      const files = await DocumentPicker.pick({
        type: [DocumentPicker.types.video, DocumentPicker.types.images],
        allowMultiSelection: true,
      });
      navigation.navigate('Edit', { files });
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) Alert.alert('오류', e.message);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <Text style={styles.logo}>무브먼트</Text>
      <Text style={styles.sub}>Shorts Creator v2.73</Text>
      <Text style={styles.platform}>{detectPlatform().toUpperCase()}</Text>

      <TouchableOpacity style={styles.btn} onPress={pickMedia}>
        <Text style={styles.btnText}>📁 영상 선택</Text>
      </TouchableOpacity>

      {rendering && (
        <>
          <Text style={styles.statusMsg}>{statusMsg}</Text>
          <ProgressBar value={progress} />
        </>
      )}
    </View>
  );
}

// ─── 편집 화면 ───────────────────────────────────────────────────────────
function EditScreen({ route, navigation }) {
  const { files } = route.params;
  const [progress, setProgress] = useState(0);
  const [scenes,   setScenes]   = useState(
    files.map((f, i) => ({ path: f.uri, start: 0, duration: 3, idx: i }))
  );

  async function doRender() {
    const edl = createEDL({ restaurantName: 'Android 편집', scenes, theme: 'hansik' });
    if (!validateEDL(edl).valid) return Alert.alert('오류', '씬이 없습니다');

    const outPath = `${RNFS.CachesDirectoryPath}/moovlog_${Date.now()}.mp4`;
    try {
      await renderWithAndroid(scenes, outPath, { onProgress: setProgress });
      Alert.alert('완료', `다운로드 폴더에 저장됐습니다`);
    } catch (e) {
      Alert.alert('렌더링 실패', e.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>편집</Text>
      <Text style={styles.sub}>{files.length}개 파일 · 총 {totalDuration(scenes).toFixed(1)}초</Text>

      {/* #18 터치 트림 컨트롤러 */}
      {scenes.map((sc, i) => (
        <TrimControl key={i} scene={sc}
          onChange={updated => setScenes(s => s.map((x, j) => j === i ? { ...x, ...updated } : x))} />
      ))}

      <ProgressBar value={progress} />

      <TouchableOpacity style={styles.btn} onPress={doRender}>
        <Text style={styles.btnText}>🎬 렌더링 시작</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>← 뒤로</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 앱 루트 ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Edit" component={EditScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo:        { fontSize: 36, fontWeight: '900', color: '#FF6B35', marginBottom: 4 },
  sub:         { fontSize: 14, color: '#888', marginBottom: 4 },
  platform:    { fontSize: 11, color: '#444', marginBottom: 32 },
  statusMsg:   { color: '#aaa', marginBottom: 8, fontSize: 13 },
  btn:         { backgroundColor: '#FF6B35', paddingVertical: 14, paddingHorizontal: 36,
                 borderRadius: 12, marginTop: 12, minWidth: 200, alignItems: 'center' },
  btnSecondary:{ backgroundColor: '#333' },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
});
