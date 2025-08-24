import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FaceDetector from 'expo-face-detector';

import Glass from '@/components/Glass';
import Button from '@/components/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, borderRadius } from '@/styles/design-system';

const { width, height } = Dimensions.get('window');

interface AIAvatar {
  id: string;
  name: string;
  style: string;
  thumbnail: string;
  prompt: string;
  voiceId: string;
  personality: string;
}

interface AIAvatarCategory {
  id: string;
  name: string;
  avatars: AIAvatar[];
}

const avatarCategories: AIAvatarCategory[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    avatars: [
      {
        id: 'hyperrealistic',
        name: 'Hyper Realistic',
        style: 'photorealistic_8k',
        thumbnail: '👤',
        prompt: 'Ultra realistic human avatar, 8K quality, perfect skin texture',
        voiceId: 'voice_realistic_1',
        personality: 'Professional and engaging',
      },
      {
        id: 'business_pro',
        name: 'Business Pro',
        style: 'professional_corporate',
        thumbnail: '👔',
        prompt: 'Professional business avatar, corporate attire, confident posture',
        voiceId: 'voice_corporate_1',
        personality: 'Authoritative and trustworthy',
      },
      {
        id: 'casual_friendly',
        name: 'Casual Friendly',
        style: 'casual_approachable',
        thumbnail: '😊',
        prompt: 'Friendly casual avatar, warm smile, approachable demeanor',
        voiceId: 'voice_friendly_2',
        personality: 'Warm and relatable',
      },
      {
        id: 'influencer_style',
        name: 'Influencer',
        style: 'social_media_ready',
        thumbnail: '📱',
        prompt: 'Social media influencer avatar, trendy style, camera-ready',
        voiceId: 'voice_trendy_1',
        personality: 'Charismatic and trendy',
      },
    ]
  },
  {
    id: 'anime',
    name: 'Anime/Manga',
    avatars: [
      {
        id: 'anime_kawaii',
        name: 'Kawaii Style',
        style: 'anime_kawaii',
        thumbnail: '🌸',
        prompt: 'Cute kawaii anime character, big expressive eyes, colorful hair',
        voiceId: 'voice_anime_cute',
        personality: 'Kawaii and energetic',
      },
      {
        id: 'anime_hero',
        name: 'Anime Hero',
        style: 'shounen_protagonist',
        thumbnail: '⚡',
        prompt: 'Heroic anime protagonist, determined expression, dynamic pose',
        voiceId: 'voice_anime_hero',
        personality: 'Brave and determined',
      },
      {
        id: 'anime_magical',
        name: 'Magical Girl',
        style: 'magical_girl',
        thumbnail: '✨',
        prompt: 'Magical girl anime character, sparkly outfit, magical powers',
        voiceId: 'voice_anime_magical',
        personality: 'Magical and inspiring',
      },
      {
        id: 'anime_dark',
        name: 'Dark Anime',
        style: 'dark_anime',
        thumbnail: '🖤',
        prompt: 'Dark anime character, mysterious aura, gothic style',
        voiceId: 'voice_anime_dark',
        personality: 'Mysterious and intense',
      },
    ]
  },
  {
    id: 'cartoon',
    name: 'Cartoon/Animation',
    avatars: [
      {
        id: 'pixar_style',
        name: 'Pixar Style',
        style: 'pixar_3d',
        thumbnail: '🎨',
        prompt: '3D Pixar character, friendly and expressive, vibrant colors',
        voiceId: 'voice_pixar_1',
        personality: 'Warm and family-friendly',
      },
      {
        id: 'disney_classic',
        name: 'Disney Classic',
        style: 'disney_2d',
        thumbnail: '🏰',
        prompt: 'Classic Disney animation style, timeless charm, expressive features',
        voiceId: 'voice_disney_1',
        personality: 'Charming and timeless',
      },
      {
        id: 'cartoon_modern',
        name: 'Modern Cartoon',
        style: 'modern_cartoon',
        thumbnail: '📺',
        prompt: 'Modern cartoon style, bold colors, simplified features',
        voiceId: 'voice_cartoon_modern',
        personality: 'Fun and contemporary',
      },
      {
        id: 'comic_book',
        name: 'Comic Book',
        style: 'comic_book_art',
        thumbnail: '💥',
        prompt: 'Comic book art style, dynamic poses, bold outlines',
        voiceId: 'voice_comic_1',
        personality: 'Dynamic and heroic',
      },
    ]
  },
  {
    id: 'fantasy',
    name: 'Fantasy/Sci-Fi',
    avatars: [
      {
        id: 'fantasy_warrior',
        name: 'Fantasy Warrior',
        style: 'fantasy_epic',
        thumbnail: '⚔️',
        prompt: 'Epic fantasy warrior, magical armor, heroic stance',
        voiceId: 'voice_epic_warrior',
        personality: 'Heroic and courageous',
      },
      {
        id: 'space_explorer',
        name: 'Space Explorer',
        style: 'sci_fi_futuristic',
        thumbnail: '🚀',
        prompt: 'Futuristic space explorer, high-tech suit, cosmic background',
        voiceId: 'voice_sci_fi_1',
        personality: 'Adventurous and intelligent',
      },
      {
        id: 'cyberpunk_hacker',
        name: 'Cyberpunk Hacker',
        style: 'cyberpunk_neon',
        thumbnail: '🤖',
        prompt: 'Cyberpunk hacker, neon lights, tech augmentations',
        voiceId: 'voice_cyberpunk_1',
        personality: 'Edgy and tech-savvy',
      },
      {
        id: 'magical_wizard',
        name: 'Magical Wizard',
        style: 'fantasy_magic',
        thumbnail: '🧙‍♂️',
        prompt: 'Wise magical wizard, flowing robes, mystical aura',
        voiceId: 'voice_wizard_1',
        personality: 'Wise and mystical',
      },
    ]
  },
  {
    id: 'historical',
    name: 'Historical/Period',
    avatars: [
      {
        id: 'victorian_gentleman',
        name: 'Victorian Era',
        style: 'victorian_period',
        thumbnail: '🎩',
        prompt: 'Victorian era gentleman, period clothing, refined demeanor',
        voiceId: 'voice_victorian_1',
        personality: 'Refined and eloquent',
      },
      {
        id: 'medieval_knight',
        name: 'Medieval Knight',
        style: 'medieval_armor',
        thumbnail: '🏰',
        prompt: 'Noble medieval knight, shining armor, chivalrous bearing',
        voiceId: 'voice_medieval_1',
        personality: 'Noble and chivalrous',
      },
      {
        id: 'roaring_twenties',
        name: '1920s Style',
        style: 'art_deco_1920s',
        thumbnail: '🎭',
        prompt: '1920s flapper style, art deco elements, jazz age glamour',
        voiceId: 'voice_1920s_1',
        personality: 'Glamorous and spirited',
      },
      {
        id: 'retro_80s',
        name: '80s Retro',
        style: 'retro_80s_neon',
        thumbnail: '🕺',
        prompt: '1980s retro style, neon colors, synthwave aesthetic',
        voiceId: 'voice_80s_1',
        personality: 'Energetic and nostalgic',
      },
    ]
  },
  {
    id: 'abstract',
    name: 'Abstract/Artistic',
    avatars: [
      {
        id: 'abstract_geometric',
        name: 'Geometric Art',
        style: 'geometric_abstract',
        thumbnail: '🔷',
        prompt: 'Abstract geometric avatar, bold shapes, artistic composition',
        voiceId: 'voice_artistic_1',
        personality: 'Creative and unique',
      },
      {
        id: 'watercolor_art',
        name: 'Watercolor',
        style: 'watercolor_painting',
        thumbnail: '🎨',
        prompt: 'Watercolor painting style, soft brushstrokes, flowing colors',
        voiceId: 'voice_artistic_2',
        personality: 'Gentle and artistic',
      },
      {
        id: 'pop_art',
        name: 'Pop Art',
        style: 'pop_art_warhol',
        thumbnail: '🎪',
        prompt: 'Pop art style, bright colors, bold contrasts, retro feel',
        voiceId: 'voice_pop_art_1',
        personality: 'Bold and expressive',
      },
      {
        id: 'minimalist',
        name: 'Minimalist',
        style: 'minimalist_clean',
        thumbnail: '⚪',
        prompt: 'Minimalist design, clean lines, simple forms, elegant',
        voiceId: 'voice_minimal_1',
        personality: 'Calm and sophisticated',
      },
    ]
  },
];

// Flatten all avatars for easier access
const avatarStyles = avatarCategories.reduce((all, category) => [...all, ...category.avatars], [] as AIAvatar[]);

const AIAvatarStudioScreen: React.FC = () => {
  const { colors } = useTheme();
  const [selectedAvatar, setSelectedAvatar] = useState<AIAvatar | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('photorealistic');
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [avatarGenerating, setAvatarGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [voiceCloning, setVoiceCloning] = useState(false);
  const [customVoice, setCustomVoice] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  const handleFacesDetected = ({ faces }: { faces: FaceDetector.FaceFeature[] }) => {
    setFaceDetected(faces.length > 0);
    if (faces.length > 0) {
      // Store face data for avatar generation
      console.log('Face detected with confidence:', faces[0].faceID);
    }
  };

  const captureAndGenerate = async () => {
    if (!cameraRef.current || !selectedAvatar) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
      });

      setAvatarGenerating(true);
      // Simulate AI generation
      setTimeout(() => {
        setGeneratedAvatar(photo.uri);
        setAvatarGenerating(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to capture:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>AI Avatar Studio</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Transform into any character instantly
          </Text>
        </View>

        {/* Camera View */}
        <View style={styles.cameraSection}>
          <Glass variant="accent" style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.front}
              onFacesDetected={handleFacesDetected}
              faceDetectorSettings={{
                mode: FaceDetector.FaceDetectorMode.accurate,
                detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
                runClassifications: FaceDetector.FaceDetectorClassifications.all,
                minDetectionInterval: 100,
                tracking: true,
              }}
            >
              {/* Face Detection Overlay */}
              {faceDetected && (
                <View style={styles.faceOverlay}>
                  <View style={styles.faceFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  <Text style={styles.faceText}>Face Detected ✓</Text>
                </View>
              )}

              {/* AR Preview Overlay */}
              {selectedAvatar && !generatedAvatar && (
                <View style={styles.arOverlay}>
                  <Text style={styles.arText}>{selectedAvatar.thumbnail}</Text>
                  <Text style={styles.arLabel}>{selectedAvatar.name} Mode</Text>
                </View>
              )}
            </Camera>
          </Glass>

          {/* Generated Avatar Preview */}
          {generatedAvatar && (
            <View style={styles.generatedPreview}>
              <Image source={{ uri: generatedAvatar }} style={styles.generatedImage} />
              <Glass variant="accent" style={styles.generatedOverlay}>
                <Text style={styles.generatedText}>AI Avatar Ready!</Text>
                <View style={styles.generatedActions}>
                  <Button
                    title="Save"
                    icon="download"
                    size="small"
                    variant="glass"
                    onPress={() => {}}
                  />
                  <Button
                    title="Share"
                    icon="share"
                    size="small"
                    variant="glass"
                    onPress={() => {}}
                  />
                </View>
              </Glass>
            </View>
          )}
        </View>

        {/* Avatar Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose Avatar Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesGrid}>
              {avatarCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={styles.categoryCard}
                >
                  <Glass
                    variant={selectedCategory === category.id ? 'accent' : 'subtle'}
                    style={[
                      styles.categoryCardInner,
                      selectedCategory === category.id && styles.categoryCardSelected,
                    ]}
                  >
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                      {category.avatars.length} styles
                    </Text>
                  </Glass>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Avatar Styles */}
        <View style={styles.stylesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose Your Avatar Style
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.stylesGrid}>
              {avatarCategories.find(c => c.id === selectedCategory)?.avatars.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  onPress={() => setSelectedAvatar(avatar)}
                  style={styles.styleCard}
                >
                  <Glass
                    variant={selectedAvatar?.id === avatar.id ? 'accent' : 'subtle'}
                    style={[
                      styles.styleCardInner,
                      selectedAvatar?.id === avatar.id && styles.styleCardSelected,
                    ]}
                  >
                    <Text style={styles.styleEmoji}>{avatar.thumbnail}</Text>
                    <Text style={[styles.styleName, { color: colors.text }]}>
                      {avatar.name}
                    </Text>
                    <Text style={[styles.stylePersonality, { color: colors.textSecondary }]}>
                      {avatar.personality}
                    </Text>
                  </Glass>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Voice Cloning Section */}
        <View style={styles.voiceSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Voice Settings
          </Text>
          
          <Glass variant="subtle" style={styles.voiceCard}>
            <View style={styles.voiceOption}>
              <View style={styles.voiceOptionHeader}>
                <Ionicons name="mic" size={24} color={colors.primary} />
                <Text style={[styles.voiceOptionTitle, { color: colors.text }]}>
                  Use Pre-trained Voice
                </Text>
              </View>
              <Text style={[styles.voiceOptionDescription, { color: colors.textSecondary }]}>
                Choose from 100+ professional voices
              </Text>
              <TouchableOpacity 
                style={[styles.voiceButton, !voiceCloning && styles.voiceButtonActive]}
                onPress={() => setVoiceCloning(false)}
              >
                <Text style={[styles.voiceButtonText, { color: !voiceCloning ? '#FFFFFF' : colors.text }]}>
                  Browse Voices
                </Text>
              </TouchableOpacity>
            </View>
          </Glass>

          <Glass variant="subtle" style={styles.voiceCard}>
            <View style={styles.voiceOption}>
              <View style={styles.voiceOptionHeader}>
                <Ionicons name="recording" size={24} color={colors.primary} />
                <Text style={[styles.voiceOptionTitle, { color: colors.text }]}>
                  Clone Your Voice
                </Text>
              </View>
              <Text style={[styles.voiceOptionDescription, { color: colors.textSecondary }]}>
                Record 30 seconds to create your AI voice
              </Text>
              <TouchableOpacity 
                style={[styles.voiceButton, voiceCloning && styles.voiceButtonActive]}
                onPress={() => setVoiceCloning(true)}
              >
                <Text style={[styles.voiceButtonText, { color: voiceCloning ? '#FFFFFF' : colors.text }]}>
                  {customVoice ? 'Re-record' : 'Start Recording'}
                </Text>
              </TouchableOpacity>
            </View>
          </Glass>

          {customVoice && (
            <Glass variant="accent" style={styles.customVoiceCard}>
              <View style={styles.customVoiceInfo}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.customVoiceText, { color: colors.text }]}>
                  Custom voice ready!
                </Text>
                <TouchableOpacity onPress={() => setCustomVoice(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </Glass>
          )}
        </View>

        {/* AI Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            AI Enhancement Features
          </Text>
          
          <Glass variant="subtle" style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="mic" size={24} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Voice Cloning
              </Text>
            </View>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Clone your voice or choose from 100+ AI voices
            </Text>
          </Glass>

          <Glass variant="subtle" style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="body" size={24} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Motion Capture
              </Text>
            </View>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Real-time body tracking and gesture replication
            </Text>
          </Glass>

          <Glass variant="subtle" style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Background Removal
              </Text>
            </View>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              AI-powered green screen without physical setup
            </Text>
          </Glass>

          <Glass variant="subtle" style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Ionicons name="color-palette" size={24} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Style Transfer
              </Text>
            </View>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              Apply artistic styles from famous paintings and movies
            </Text>
          </Glass>
        </View>

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <Button
            title={avatarGenerating ? "Generating..." : "Generate AI Avatar"}
            variant="primary"
            gradient={['#9333EA', '#EC4899']}
            icon="star"
            size="large"
            fullWidth
            loading={avatarGenerating}
            disabled={!selectedAvatar || !faceDetected}
            onPress={captureAndGenerate}
          />
          {!faceDetected && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Position your face in the camera to start
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.largeTitle,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  cameraSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  cameraContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: height * 0.5,
  },
  camera: {
    flex: 1,
  },
  faceOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFrame: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  faceText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  arOverlay: {
    position: 'absolute',
    top: spacing.xl,
    alignSelf: 'center',
    alignItems: 'center',
  },
  arText: {
    fontSize: 60,
  },
  arLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  generatedPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  generatedOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  generatedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  generatedActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stylesSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  stylesGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  styleCard: {
    width: 120,
  },
  styleCardInner: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    minHeight: 140,
    justifyContent: 'center',
  },
  styleCardSelected: {
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  styleEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  styleName: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
  },
  stylePersonality: {
    ...typography.caption2,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  featuresSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  featureCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.headline,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  featureDescription: {
    ...typography.body,
    marginLeft: spacing.xl + 8,
  },
  generateSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hint: {
    ...typography.caption1,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryCard: {
    minWidth: 140,
  },
  categoryCardInner: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    minHeight: 80,
    justifyContent: 'center',
  },
  categoryCardSelected: {
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  categoryName: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryCount: {
    ...typography.caption2,
    textAlign: 'center',
  },
  voiceSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  voiceCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  voiceOption: {
    alignItems: 'center',
  },
  voiceOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  voiceOptionTitle: {
    ...typography.headline,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  voiceOptionDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  voiceButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
    backgroundColor: 'transparent',
  },
  voiceButtonActive: {
    backgroundColor: '#9333EA',
    borderColor: '#9333EA',
  },
  voiceButtonText: {
    ...typography.callout,
    fontWeight: '600',
  },
  customVoiceCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  customVoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customVoiceText: {
    ...typography.callout,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.sm,
  },
});

export default AIAvatarStudioScreen;