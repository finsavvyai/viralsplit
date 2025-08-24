import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import CustomAlert from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { socialAuthService } from '@/services/socialAuth';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, socialLogin } = useAuth();
  const { colors } = useTheme();
  const { alertState, showError, showSuccess, hideAlert } = useCustomAlert();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Automated test function
  const runTestFlow = () => {
    // Auto-fill with existing user data
    setFormData({
      username: 'testuser',
      email: 'shahar@gmail.com', // Use existing email to test error
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
    });
    setAcceptedTerms(true);
    
    // Auto-submit after a brief delay
    setTimeout(() => {
      handleRegister();
    }, 500);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;
    
    if (!username.trim()) {
      showError('Missing Username', 'Please enter a username');
      return false;
    }
    
    if (username.trim().length < 3) {
      showError('Username Too Short', 'Username must be at least 3 characters long');
      return false;
    }
    
    if (!email.trim() || !email.includes('@')) {
      showError('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    
    if (password.length < 8) {
      showError('Password Too Short', 'Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match');
      return false;
    }
    
    if (!acceptedTerms) {
      showError('Terms Required', 'Please accept the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(
        formData.email.trim().toLowerCase(), 
        formData.password,
        formData.username.trim()
      );
      showSuccess('Account Created!', 'Welcome to ViralSplit! Your account has been created successfully.');
    } catch (error: any) {
      let errorMessage = 'Failed to create account';
      
      // Handle different error structures
      if (error?.response?.data?.detail) {
        // Direct Axios error
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          // Validation error array
          errorMessage = detail[0].msg;
        }
      } else if (typeof error === 'string') {
        // String error
        errorMessage = error;
      } else if (error?.message?.includes('400')) {
        // Status code 400 errors
        if (error.code === 'ERR_BAD_REQUEST') {
          // For status 400, this is most likely "User already exists"
          errorMessage = 'An account with this email already exists. Please try signing in instead.';
        } else {
          errorMessage = 'Please check your information and try again.';
        }
      } else if (error?.message?.includes('422')) {
        // Status code 422 errors (validation)
        errorMessage = 'Please check your information and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple' | 'twitter') => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await socialAuthService.authenticateWithProvider(provider);
      
      if (result.success && result.user && result.token) {
        await socialLogin(result.token, result.user);
        showSuccess('Account Created!', `Welcome ${result.user.username || result.user.email}! Your account has been created successfully.`);
      } else {
        showError('Registration Failed', result.error || 'Please try again');
      }
    } catch (error: any) {
      console.error(`${provider} signup error:`, error);
      let errorMessage = `${provider} registration failed`;
      const errorDetail = error.response?.data?.detail || error.message;
      
      if (errorDetail?.includes('already exists') || errorDetail?.includes('User already exists')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (errorDetail) {
        errorMessage = errorDetail;
      }
      showError('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <LinearGradient
      colors={[colors.secondary, colors.primary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={styles.logoContainer}>
                  <Ionicons name="person-add" size={40} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join thousands of creators going viral with AI</Text>
                
                {/* Test Button - Only in development */}
                {__DEV__ && (
                  <TouchableOpacity 
                    style={styles.testButton}
                    onPress={runTestFlow}
                  >
                    <Text style={styles.testButtonText}>🧪 Run Test Flow</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Registration Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={formData.username}
                    onChangeText={(text) => updateFormData('username', text)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={formData.email}
                    onChangeText={(text) => updateFormData('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password (min 8 characters)"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={formData.password}
                    onChangeText={(text) => updateFormData('password', text)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateFormData('confirmPassword', text)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Requirements */}
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Password must contain:</Text>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={formData.password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={formData.password.length >= 8 ? "#10B981" : "rgba(255,255,255,0.5)"} 
                    />
                    <Text style={[styles.requirementText, 
                      formData.password.length >= 8 && styles.requirementMet
                    ]}>
                      At least 8 characters
                    </Text>
                  </View>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={/[A-Z]/.test(formData.password) ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={/[A-Z]/.test(formData.password) ? "#10B981" : "rgba(255,255,255,0.5)"} 
                    />
                    <Text style={[styles.requirementText, 
                      /[A-Z]/.test(formData.password) && styles.requirementMet
                    ]}>
                      One uppercase letter
                    </Text>
                  </View>
                  
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={/[0-9]/.test(formData.password) ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={/[0-9]/.test(formData.password) ? "#10B981" : "rgba(255,255,255,0.5)"} 
                    />
                    <Text style={[styles.requirementText, 
                      /[0-9]/.test(formData.password) && styles.requirementMet
                    ]}>
                      One number
                    </Text>
                  </View>
                </View>

                {/* Terms and Conditions */}
                <TouchableOpacity 
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <Ionicons 
                    name={acceptedTerms ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={acceptedTerms ? "#10B981" : "rgba(255,255,255,0.7)"} 
                  />
                  <Text style={styles.checkboxText}>
                    I agree to the{' '}
                    <Text style={styles.linkText}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.linkText}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.registerButton, !acceptedTerms && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading || !acceptedTerms}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#9333EA" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Social Registration */}
              <View style={styles.socialSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity 
                    style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                    onPress={() => handleSocialSignUp('google')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                    onPress={() => handleSocialSignUp('apple')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                    onPress={() => handleSocialSignUp('twitter')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="logo-twitter" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

      </SafeAreaView>
    </LinearGradient>

    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onDismiss={hideAlert}
      primaryButton={alertState.primaryButton}
      secondaryButton={alertState.secondaryButton}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  passwordRequirements: {
    marginBottom: 20,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  requirementsTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 16,
  },
  requirementText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginLeft: 8,
    flexWrap: 'wrap',
  },
  requirementMet: {
    color: '#10B981',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  checkboxText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 55,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#9333EA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialSection: {
    marginBottom: 30,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  signInLink: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RegisterScreen;