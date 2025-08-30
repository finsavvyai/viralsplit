import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  PanResponder,
  BackHandler,
} from 'react-native';
import { Camera, CameraType, FlashMode, VideoQuality } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as FaceDetector from 'expo-face-detector';
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
import { videoService } from '@/services/videoService';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

interface ARFilter {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  intensity: number;
}

interface DetectedFace {
  faceID: number;
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  landmarks?: any;
  confidence: number;
}

const RealCameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { isRecording, settings } = useAppSelector(state => state.camera);
  
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState(CameraType.back);
  const [flash, setFlash] = useState(FlashMode.off);
  const [isReady, setIsReady] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeScore, setRealTimeScore] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [arFilters, setArFilters] = useState<ARFilter[]>([
    { id: 'beauty', name: 'Beauty', icon: 'sparkles', enabled: false, intensity: 50 },
    { id: 'vintage', name: 'Vintage', icon: 'camera', enabled: false, intensity: 70 },
    { id: 'neon', name: 'Neon', icon: 'flash', enabled: false, intensity: 60 },
    { id: 'blur', name: 'Blur BG', icon: 'eye-off', enabled: false, intensity: 80 },
  ]);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);
  
  const cameraRef = useRef<Camera>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const analysisTimer = useRef<NodeJS.Timeout | null>(null);
  const recordButtonAnimation = useRef(new Animated.Value(1)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;

  // Handle device back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isRecording) {
        Alert.alert(
          'Stop Recording?',
          'Are you sure you want to stop recording and go back?',
          [
            { text: 'Continue Recording', style: 'cancel' },
            { text: 'Stop & Go Back', onPress: () => {
              handleStopRecording();
              navigation.goBack();
            }},
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isRecording]);

  // Recording timer and real-time analysis
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Pulse animation for record button
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
      
      // Real-time AI analysis
      analysisTimer.current = setInterval(() => {
        performRealTimeAnalysis();
      }, 2000);

    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      if (analysisTimer.current) {
        clearInterval(analysisTimer.current);
        analysisTimer.current = null;
      }
      recordButtonAnimation.stopAnimation();
      setRecordingTime(0);
      setRealTimeScore(0);
    }

    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (analysisTimer.current) clearInterval(analysisTimer.current);
    };
  }, [isRecording]);

  const performRealTimeAnalysis = useCallback(async () => {
    if (!isProcessingFrame && cameraRef.current) {
      setIsProcessingFrame(true);
      
      try {
        // Simulate advanced AI analysis based on face detection, lighting, composition
        let score = 60 + Math.random() * 20; // Base score 60-80
        
        // Boost score based on detected faces
        if (detectedFaces.length > 0) {
          score += detectedFaces.length * 5;
          // Boost for high confidence faces
          const avgConfidence = detectedFaces.reduce((sum, face) => sum + face.confidence, 0) / detectedFaces.length;
          score += avgConfidence * 10;
        }
        
        // Apply filter bonuses
        const enabledFilters = arFilters.filter(f => f.enabled);
        score += enabledFilters.length * 3;
        
        // Cap at 100
        score = Math.min(100, score);
        
        setRealTimeScore(score);
        
        Animated.spring(scoreAnimation, {
          toValue: score / 100,
          useNativeDriver: false,
        }).start();
        
      } catch (error) {
        console.error('Real-time analysis error:', error);
      } finally {
        setIsProcessingFrame(false);
      }
    }
  }, [detectedFaces, arFilters, isProcessingFrame]);

  const onFacesDetected = useCallback(({ faces }: { faces: any[] }) => {
    const processedFaces: DetectedFace[] = faces.map(face => ({
      faceID: face.faceID,
      bounds: face.bounds,
      landmarks: face.landmarks,
      confidence: face.rollAngle !== undefined ? 0.8 : 0.6, // Estimate confidence
    }));
    setDetectedFaces(processedFaces);
  }, []);

  const requestPermissions = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'ViralSplit needs camera access to record and analyze videos with AI',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // In a real app, you'd open device settings
              Alert.alert('Please enable camera permission in device settings');
            }},
          ]
        );
        return false;
      }
    }
    
    if (!mediaPermission?.granted) {
      const result = await requestMediaPermission();
      if (!result.granted) {
        Alert.alert(
          'Media Library Permission Required',
          'Permission needed to save your amazing videos',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    
    return true;
  };

  const handleStartRecording = async () => {
    if (!isReady || isRecording) return;
    
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (cameraRef.current) {
        const videoQuality = settings.quality === '4k' ? VideoQuality['4:3'] : 
                           settings.quality === 'high' ? VideoQuality['720p'] : VideoQuality['480p'];

        const recording = await cameraRef.current.recordAsync({
          quality: videoQuality,
          maxDuration: 300, // 5 minutes max
          mute: false,
        });
        
        const session = {
          id: Date.now().toString(),
          uri: recording.uri,
          duration: recordingTime,
          size: 0,
          thumbnail: '',
          created_at: new Date().toISOString(),
        };
        
        dispatch(startRecording(session));
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording || !cameraRef.current) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      cameraRef.current.stopRecording();
      dispatch(stopRecording());
      
      // Show success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to video review
      navigation.navigate('VideoReview', { 
        videoUri: '', // Will be set by the recording result
        duration: recordingTime,
        viralScore: realTimeScore 
      });
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording properly.');
    }
  };

  const toggleCameraFacing = async () => {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = async () => {
    const newFlash = flash === FlashMode.off ? FlashMode.on : FlashMode.off;
    setFlash(newFlash);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleARFilter = async (filterId: string) => {
    const updatedFilters = arFilters.map(filter => {
      if (filter.id === filterId) {
        return { ...filter, enabled: !filter.enabled };
      }
      return filter;
    });
    setArFilters(updatedFilters);
    
    // Animate filter changes
    Animated.spring(filterAnimation, {
      toValue: updatedFilters.some(f => f.enabled) ? 1 : 0,
      useNativeDriver: false,
    }).start();

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateSetting = <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    dispatch(updateCameraSettings({ [key]: value }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pinch gesture for zoom
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        // Handle pinch-to-zoom gesture
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          // Calculate distance between two fingers
          // Update zoom level accordingly
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  if (!cameraPermission?.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={{ transform: [{ scale: scoreAnimation }] }}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.permissionIcon}
          >
            <Ionicons name="camera-outline" size={60} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          ViralSplit uses advanced AI to analyze your videos in real-time and optimize them for maximum engagement
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.permissionGradient}>
            <Text style={styles.permissionButtonText}>Enable Camera & AI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={facing}
        flashMode={flash}
        onCameraReady={() => setIsReady(true)}
        onFacesDetected={onFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Face Detection Overlays */}
          {detectedFaces.map((face, index) => (
            <View
              key={`face-${face.faceID}-${index}`}
              style={[
                styles.faceOverlay,
                {
                  left: face.bounds.origin.x,
                  top: face.bounds.origin.y,
                  width: face.bounds.size.width,
                  height: face.bounds.size.height,
                },
              ]}
            >
              <View style={styles.faceCorners}>
                <View style={[styles.faceCorner, styles.topLeft]} />
                <View style={[styles.faceCorner, styles.topRight]} />
                <View style={[styles.faceCorner, styles.bottomLeft]} />
                <View style={[styles.faceCorner, styles.bottomRight]} />
              </View>
            </View>
          ))}

          {/* Header Controls */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerText}>ViralSplit Camera</Text>
              {detectedFaces.length > 0 && (
                <Text style={styles.faceCount}>{detectedFaces.length} face{detectedFaces.length > 1 ? 's' : ''} detected</Text>
              )}
            </View>
            
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
              <Animated.View style={[styles.recordingDot, {
                opacity: scoreAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              }]} />
              <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            </BlurView>
          )}

          {/* Real-time AI Score */}
          {isRecording && realTimeScore > 0 && (
            <BlurView intensity={80} style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Viral Score</Text>
              <Text style={[styles.scoreValue, {
                color: realTimeScore > 80 ? '#10B981' : realTimeScore > 60 ? '#F59E0B' : '#EF4444',
              }]}>
                {Math.round(realTimeScore)}%
              </Text>
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
              <Text style={styles.scoreHint}>
                {realTimeScore > 80 ? '🔥 Viral!' : realTimeScore > 60 ? '📈 Good' : '💡 Try filters'}
              </Text>
            </BlurView>
          )}

          {/* AR Filters */}
          <View style={styles.filtersContainer}>
            {arFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterButton, filter.enabled && styles.filterButtonActive]}
                onPress={() => toggleARFilter(filter.id)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={20} 
                  color={filter.enabled ? colors.primary : '#FFFFFF'} 
                />
                <Text style={[styles.filterText, filter.enabled && styles.filterTextActive]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Side Controls */}
          <View style={styles.sideControls}>
            <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sideButton} onPress={toggleFlash}>
              <Ionicons 
                name={flash === FlashMode.off ? "flash-off" : "flash"} 
                size={24} 
                color={flash === FlashMode.off ? "#FFFFFF" : "#F59E0B"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sideButton}>
              <Ionicons name="color-filter" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideButton}>
              <Ionicons name="speedometer" size={24} color="#FFFFFF" />
              <Text style={styles.sideButtonText}>AI</Text>
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
                  isRecording && styles.recordButtonActive,
                  !isReady && styles.recordButtonDisabled
                ]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                disabled={!isReady}
              >
                <LinearGradient
                  colors={isRecording ? ['#EF4444', '#DC2626'] : [colors.primary, colors.secondary]}
                  style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]}
                >
                  {!isReady ? (
                    <Ionicons name="hourglass" size={24} color="#FFFFFF" />
                  ) : isRecording ? (
                    <Ionicons name="stop" size={24} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="videocam" size={24} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.modeButton}>
              <Text style={styles.modeText}>Video</Text>
              <Text style={styles.modeSubtext}>AI Enhanced</Text>
            </TouchableOpacity>
          </View>

          {/* Advanced Settings Panel */}
          {showSettings && (
            <BlurView intensity={95} style={styles.settingsPanel}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>AI Camera Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingsContent}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Video Quality</Text>
                  <View style={styles.settingOptions}>
                    {['720p', '1080p', '4k'].map((quality) => (
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
                          {quality}
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

                <TouchableOpacity style={styles.settingToggle}>
                  <Text style={styles.settingLabel}>Real-time AI Analysis</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingToggle}>
                  <Text style={styles.settingLabel}>Face Detection</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
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
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
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
  faceOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 8,
  },
  faceCorners: {
    flex: 1,
  },
  faceCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  faceCount: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 2,
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
    minWidth: 90,
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreBar: {
    width: 70,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 2,
  },
  scoreHint: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  filtersContainer: {
    position: 'absolute',
    left: 20,
    top: '35%',
  },
  filterButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#9333EA',
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  filterTextActive: {
    color: '#9333EA',
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
  sideButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordButtonActive: {
    borderColor: '#EF4444',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  modeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modeSubtext: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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

export default RealCameraScreen;