import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, MapPin, Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react-native';
import { colors } from '../../services/theme/colors';
import { spacing } from '../../services/theme/spacing';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export const RequestDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { request } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return colors.primary;
      case 'PENDING': return colors.gold;
      case 'ASSIGNED':
      case 'IN_PROGRESS': return colors.greenAccent;
      case 'CANCELLED': return colors.error;
      default: return colors.textBlackSoft;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle color={colors.primary} size={20} />;
      default: return <Clock color={getStatusColor(status)} size={20} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textBlack} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon(request.status)}
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status}
            </Text>
          </View>
          <Text style={styles.requestId}>ID: {request.id.split('-')[0].toUpperCase()}</Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pickup Location</Text>
          <Card style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <MapPin color={colors.primary} size={24} />
              <Text style={styles.addressText}>{request.location.address}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <Card style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Calendar color={colors.textBlackSoft} size={20} />
              <View style={styles.detailTextContent}>
                <Text style={styles.detailLabel}>Requested Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.detailItem}>
              <Clock color={colors.textBlackSoft} size={20} />
              <View style={styles.detailTextContent}>
                <Text style={styles.detailLabel}>Requested Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            {request.collector_id && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                  <User color={colors.textBlackSoft} size={20} />
                  <View style={styles.detailTextContent}>
                    <Text style={styles.detailLabel}>Collector ID</Text>
                    <Text style={styles.detailValue}>{request.collector_id.split('-')[0]}</Text>
                  </View>
                </View>
              </>
            )}
          </Card>
        </View>

        {request.status === 'PENDING' && (
          <View style={styles.infoBox}>
            <AlertCircle color={colors.gold} size={20} />
            <Text style={styles.infoText}>
              A collector will be assigned to your request shortly. Please wait.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutralWarm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textBlack,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statusCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  requestId: {
    fontSize: 12,
    color: colors.textBlackSoft,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textBlackSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  locationCard: {
    padding: spacing.lg,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    color: colors.textBlack,
    lineHeight: 24,
    fontWeight: '500',
  },
  detailsCard: {
    padding: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  detailTextContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textBlackSoft,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textBlack,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralCool,
    marginHorizontal: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 188, 5, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textBlack,
    lineHeight: 18,
  },
});
