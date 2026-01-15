import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { X, Check, Zap, Clock, BookOpen, Globe, Crown } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { getOfferings, purchasePackage, restorePurchases, presentPaywall } from '../utils/revenueCat';
import { PurchasesPackage } from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  theme: any;
  useNativeUI?: boolean;
}

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'Unlimited conversations' },
  { icon: BookOpen, text: 'Access to all Bible translations' },
  { icon: Globe, text: 'Cross-reference search' },
  { icon: Clock, text: 'Faster response times' },
];

export default function PaywallModal({ visible, onClose, onSuccess, theme, useNativeUI = true }: PaywallModalProps) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      if (useNativeUI) {
        handlePresentNativePaywall();
      } else {
        loadOfferings();
      }
    }
  }, [visible, useNativeUI]);

  async function handlePresentNativePaywall() {
    try {
      const success = await presentPaywall();

      if (success) {
        Alert.alert(
          'Success!',
          'Welcome to Iron Faith Pro. You now have unlimited access to all features!',
          [
            {
              text: 'Get Started',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to present paywall:', error);
      onClose();
    }
  }

  async function loadOfferings() {
    try {
      setLoading(true);
      const offering = await getOfferings();

      if (offering && offering.availablePackages.length > 0) {
        const sortedPackages = offering.availablePackages.sort((a, b) => {
          if (a.packageType === 'ANNUAL' || a.identifier.includes('yearly')) return 1;
          if (b.packageType === 'ANNUAL' || b.identifier.includes('yearly')) return -1;
          return 0;
        });
        setPackages(sortedPackages);
        const yearlyPackage = sortedPackages.find(
          pkg => pkg.packageType === 'ANNUAL' || pkg.identifier.includes('yearly')
        );
        setSelectedPackage(yearlyPackage || sortedPackages[0]);
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!selectedPackage) return;

    try {
      setLoading(true);
      const success = await purchasePackage(selectedPackage);

      if (success) {
        Alert.alert(
          'Success!',
          'Welcome to Iron Faith Premium. You now have unlimited access to all features!',
          [
            {
              text: 'Get Started',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    try {
      setIsRestoring(true);
      const success = await restorePurchases();

      if (success) {
        Alert.alert(
          'Restore Successful',
          'Your purchase has been restored!',
          [
            {
              text: 'Continue',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.container, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.text }]}>
              Premium Not Available
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              In-app purchases are only available on iOS and Android devices.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.buttonPrimary }]}>
                <Crown size={32} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
              </View>

              <Text style={[styles.title, { color: theme.text }]}>
                Upgrade to Premium
              </Text>

              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Get unlimited access to all features
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              {PREMIUM_FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.checkIcon, { backgroundColor: `${theme.buttonPrimary}20` }]}>
                      <Icon size={20} color={theme.buttonPrimary} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.featureText, { color: theme.text }]}>
                      {feature.text}
                    </Text>
                  </View>
                );
              })}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.buttonPrimary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Loading plans...
                </Text>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                  No subscription plans available at this time.
                </Text>
              </View>
            ) : (
              <View style={styles.packagesContainer}>
                {packages.map((pkg) => {
                  const isYearly = pkg.packageType === 'ANNUAL' || pkg.identifier.includes('yearly');
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  const monthlyPrice = pkg.product.price / (isYearly ? 12 : 1);
                  const savings = isYearly ? Math.round((1 - (pkg.product.price / 12) / 6.99) * 100) : 0;

                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: theme.background,
                          borderColor: isSelected ? theme.buttonPrimary : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedPackage(pkg)}
                      activeOpacity={0.7}
                    >
                      {isYearly && savings > 0 && (
                        <View style={[styles.savingsBadge, { backgroundColor: '#10B981' }]}>
                          <Text style={styles.savingsBadgeText}>Save {savings}%</Text>
                        </View>
                      )}
                      <View style={styles.packageHeader}>
                        <View style={styles.packageTitleContainer}>
                          <Text style={[styles.packageTitle, { color: theme.text }]}>
                            {isYearly ? 'Yearly' : 'Monthly'}
                          </Text>
                          {isYearly && (
                            <View style={[styles.bestValueBadge, { backgroundColor: `${theme.buttonPrimary}20` }]}>
                              <Text style={[styles.bestValueText, { color: theme.buttonPrimary }]}>
                                Best Value
                              </Text>
                            </View>
                          )}
                        </View>
                        {isSelected && (
                          <View style={[styles.selectedBadge, { backgroundColor: theme.buttonPrimary }]}>
                            <Check size={16} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.packagePrice, { color: theme.text }]}>
                        {pkg.product.priceString}
                        {isYearly && <Text style={[styles.packagePeriod, { color: theme.textSecondary }]}>/year</Text>}
                      </Text>
                      {isYearly && (
                        <Text style={[styles.packageMonthlyPrice, { color: theme.textSecondary }]}>
                          ${monthlyPrice.toFixed(2)}/month when billed annually
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: theme.buttonPrimary },
                (loading || packages.length === 0) && styles.disabledButton,
              ]}
              onPress={handlePurchase}
              disabled={loading || packages.length === 0}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isRestoring}
              activeOpacity={0.7}
            >
              <Text style={[styles.restoreButtonText, { color: theme.buttonPrimary }]}>
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
              Subscriptions auto-renew unless cancelled 24 hours before the period ends.
              Manage subscriptions in your App Store settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 32,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  featuresContainer: {
    marginBottom: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  packagesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  packagePeriod: {
    fontSize: 16,
    fontWeight: '500',
  },
  packageMonthlyPrice: {
    fontSize: 14,
  },
  packageTrial: {
    fontSize: 13,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bestValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
