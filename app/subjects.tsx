import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { POPULAR_SUBJECTS } from '@/constants/catalog';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

const SUBJECT_COLUMNS = 3;

export default function SubjectsScreen() {
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const layout = useLayout();
  const rowDir = isRTL ? ('row-reverse' as const) : ('row' as const);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('home.allSubjects'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerBackTitle: t('common.back'),
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={POPULAR_SUBJECTS}
          keyExtractor={(item) => item.id}
          numColumns={SUBJECT_COLUMNS}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: layout.contentPadding,
              maxWidth: layout.contentMaxWidth ?? '100%',
              alignSelf: 'center',
              width: '100%',
            },
          ]}
          ListHeaderComponent={
            <Text
              style={[
                styles.subtitle,
                {
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}
            >
              {t('home.allSubjectsSubtitle')}
            </Text>
          }
          columnWrapperStyle={[styles.row, { flexDirection: rowDir }]}
          renderItem={({ item: subject }) => (
            <Pressable
              style={styles.cell}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { q: language === 'ar' ? subject.ar : subject.en },
                })
              }
            >
              <View style={[styles.subjectIcon, { backgroundColor: subject.soft }]}>
                <Ionicons name={subject.icon} size={24} color={subject.tint} />
              </View>
              <Text style={styles.subjectLabel} numberOfLines={2}>
                {language === 'ar' ? subject.ar : subject.en}
              </Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingBottom: spacing.massive,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  row: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    maxWidth: `${100 / SUBJECT_COLUMNS}%`,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
});
