import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useAppDispatch, useAppSelector } from '@/store';
import { startRecording, stopRecording, updateCameraSettings } from '@/store/slices/cameraSlice';
import { useTheme } from '@/contexts/ThemeContext';
import { RootStackParamList, CameraSettings } from '@/types';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { isRecording, settings } = useAppSelector(state => state.camera);
  
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState(CameraType.back);
  const [isReady, setIsReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeScore, setRealTimeScore] = useState(0);
  
  const cameraRef = useRef<Camera>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const recordButtonAnimation = useRef(new Animated.Value(1)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Animate record button
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordButtonAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(recordButtonAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Simulate real-time AI score updates
      const scoreTimer = setInterval(() => {
        const newScore = Math.min(100, Math.random() * 40 + 60);
        setRealTimeScore(newScore);
        
        Animated.spring(scoreAnimation, {
          toValue: newScore / 100,
          useNativeDriver: false,
        }).start();
      }, 2000);

      return () => {
        clearInterval(scoreTimer);
      };
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      recordButtonAnimation.stopAnimation();
      setRecordingTime(0);
      setRealTimeScore(0);
    }
  }, [isRecording]);

  const requestPermissions = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to record videos');
        return false;
      }
    }
    
    if (!mediaPermission?.granted) {
      const result = await requestMediaPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Media library permission is required to save videos');
        return false;
      }
    }
    
    return true;
  };

  const handleStartRecording = async () => {
    if (!isReady || isRecording) return;
    
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      if (cameraRef.current) {
        const recording = await cameraRef.current.recordAsync({
          quality: settings.quality,
          maxDuration: 300, // 5 minutes max
        });
        
        // Create recording session
        const session = {
          id: Date.now().toString(),
          uri: recording.uri,
          duration: recordingTime,
          size: 0, // Will be calculated
          thumbnail: '', // Will be generated
          created_at: new Date().toISOString(),
        };
        
        dispatch(startRecording(session));
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording || !cameraRef.current) return;

    try {
      cameraRef.current.stopRecording();
      dispatch(stopRecording());
      
      // Navigate to video review screen
      // navigation.navigate('VideoReview', { videoUri: recordingUri });
      Alert.alert('Success', 'Video recorded successfully!');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  const updateSetting = <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    dispatch(updateCameraSettings({ [key]: value }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!cameraPermission?.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={80} color={colors.textSecondary} />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          ViralSplit needs camera access to record videos with AI optimization
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.permissionGradient}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={facing}
        onCameraReady={() => setIsReady(true)}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowSettings(!showSettings)}
            >
              <Ionicons name="settings" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Recording Timer */}
          {isRecording && (
            <BlurView intensity={80} style={styles.timerContainer}>
              <View style={styles.recordingDot} />
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            </BlurView>
          )}

          {/* Real-time AI Score */}
          {isRecording && realTimeScore > 0 && (
            <BlurView intensity={80} style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Viral Score</Text>
              <Text style={styles.scoreValue}>{Math.round(realTimeScore)}%</Text>
              <View style={styles.scoreBar}>
                <Animated.View
                  style={[
                    styles.scoreProgress,
                    {
                      width: scoreAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: realTimeScore > 80 ? '#10B981' : realTimeScore > 60 ? '#F59E0B' : '#EF4444',
                    },
                  ]}
                />
              </View>
            </BlurView>
          )}

          {/* Side Controls */}
          <View style={styles.sideControls}>
            <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.sideButton}
              onPress={() => updateSetting('flash', !settings.flash)}
            >
              <Ionicons 
                name={settings.flash ? "flash" : "flash-off"} 
                size={24} 
                color={settings.flash ? "#F59E0B" : "#FFFFFF"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sideButton}>
              <Ionicons name="color-filter" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.galleryButton}>
              <Ionicons name="images" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: recordButtonAnimation }] }}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive
                ]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!isReady}
              >
                <View style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonInnerActive
                ]} />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.modeButton}>
              <Text style={styles.modeText}>Video</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Panel */}
          {showSettings && (
            <BlurView intensity={80} style={styles.settingsPanel}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>Camera Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingsContent}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Quality</Text>
                  <View style={styles.settingOptions}>
                    {['low', 'medium', 'high', '4k'].map((quality) => (
                      <TouchableOpacity
                        key={quality}
                        style={[
                          styles.settingOption,
                          settings.quality === quality && styles.settingOptionActive
                        ]}
                        onPress={() => updateSetting('quality', quality as any)}
                      >
                        <Text style={[
                          styles.settingOptionText,
                          settings.quality === quality && styles.settingOptionTextActive
                        ]}>
                          {quality.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Frame Rate</Text>
                  <View style={styles.settingOptions}>
                    {[30, 60].map((fps) => (
                      <TouchableOpacity
                        key={fps}
                        style={[
                          styles.settingOption,
                          settings.fps === fps && styles.settingOptionActive
                        ]}
                        onPress={() => updateSetting('fps', fps as any)}
                      >
                        <Text style={[
                          styles.settingOptionText,
                          settings.fps === fps && styles.settingOptionTextActive
                        ]}>
                          {fps}fps
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.settingToggle}
                  onPress={() => updateSetting('stabilization', !settings.stabilization)}
                >
                  <Text style={styles.settingLabel}>Video Stabilization</Text>
                  <Ionicons 
                    name={settings.stabilization ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={settings.stabilization ? "#10B981" : "#FFFFFF"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingToggle}
                  onPress={() => updateSetting('grid', !settings.grid)}
                >
                  <Text style={styles.settingLabel}>Grid Lines</Text>
                  <Ionicons 
                    name={settings.grid ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={settings.grid ? "#10B981" : "#FFFFFF"} 
                  />
                </TouchableOpacity>
              </View>
            </BlurView>
          )}
        </SafeAreaView>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  permissionButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  permissionGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 2,
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    top: '40%',
    alignItems: 'center',
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordButtonActive: {
    borderColor: '#EF4444',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  modeButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsContent: {
    gap: 20,
  },
  settingRow: {
    gap: 12,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  settingOptionActive: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
  },
  settingOptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  settingOptionTextActive: {
    color: '#FFFFFF',
  },
  settingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default CameraScreen;